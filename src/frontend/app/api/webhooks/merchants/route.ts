import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/backend/utils/db';
import { calculateDealScore } from '@/backend/engine/deal-scorer';
import { generateDealExplanation } from '@/backend/services/llm';

export const dynamic = 'force-dynamic';

interface MerchantPriceDropPayload {
  event: 'price_drop' | 'stock_update' | 'new_lowest_offer';
  externalProductId: string;
  sourceId: string; // e.g. 'amazon', 'bestbuy', 'macys', 'walmart', 'croma'
  merchant: string;
  price: number;
  currency: string;
  inStock?: boolean;
  offerUrl?: string;
  secretKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: MerchantPriceDropPayload = await req.json();
    const { event, externalProductId, sourceId, merchant, price, currency, inStock = true, offerUrl } = payload;

    if (!externalProductId || !price || price <= 0) {
      return NextResponse.json({ error: 'Invalid webhook payload. Missing externalProductId or positive price.' }, { status: 400 });
    }

    console.log(`[Merchant Webhook] Received ${event} for ${externalProductId} from ${merchant} (${currency} ${price})`);

    // 1. Locate offer across merchants
    let offer = await prisma.offer.findUnique({
      where: {
        sourceId_externalProductId: {
          sourceId,
          externalProductId,
        },
      },
      include: {
        product: {
          include: {
            offers: {
              orderBy: { itemPrice: 'asc' },
            },
          },
        },
      },
    });

    const previousPrice = offer ? offer.itemPrice : null;
    const isNewLowest = !offer?.lowestPrice || price < offer.lowestPrice;

    if (offer) {
      // 2. Update existing offer with real-time drop
      offer = await prisma.offer.update({
        where: { id: offer.id },
        data: {
          itemPrice: price,
          totalPrice: price,
          currency: currency || offer.currency,
          availabilityStatus: inStock ? 'in_stock' : 'out_of_stock',
          lowestPrice: isNewLowest ? price : offer.lowestPrice,
          lastCheckedAt: new Date(),
        },
        include: {
          product: {
            include: {
              offers: {
                orderBy: { itemPrice: 'asc' },
              },
            },
          },
        },
      });

      // Record price observation
      await prisma.priceObservation.create({
        data: {
          offerId: offer.id,
          productId: offer.productId,
          itemPrice: price,
          totalPrice: price,
          currency: offer.currency,
        },
      });

      // Create synthetic NormalizedOffer for deal-scorer
      const normalizedOffer: any = {
        sourceId: offer.sourceId,
        externalProductId: offer.externalProductId,
        offerUrl: offer.offerUrl,
        canonicalProductId: offer.productId,
        title: offer.product.title,
        brand: offer.product.brand,
        model: offer.product.model,
        category: offer.product.category,
        variantAttributes: { condition: 'new' },
        seller: {
          id: offer.sellerId || offer.sourceId,
          name: offer.sellerName,
          isAuthorized: offer.isAuthorizedSeller,
          rating: offer.sellerRating || 4.8,
          reviewCount: offer.sellerReviewCount || 100,
        },
        price: {
          itemPrice: price,
          shippingPrice: 0,
          fees: 0,
          currency: offer.currency,
          totalPrice: price,
        },
        availabilityStatus: inStock ? 'in_stock' : 'out_of_stock',
        sourceConfidence: offer.sourceConfidence,
        observedAt: new Date(),
      };

      const evaluation = calculateDealScore({
        offer: normalizedOffer,
      });

      const explanation = await generateDealExplanation({
        productTitle: offer.product.title,
        currentPrice: price,
        signals: evaluation.signals,
        score: evaluation.score,
        sellerName: offer.sellerName,
        sellerRating: offer.sellerRating || 4.8,
        lowestPrice: offer.lowestPrice || price,
      });

      await prisma.dealEvaluation.create({
        data: {
          offerId: offer.id,
          score: evaluation.score,
          recommendation: evaluation.recommendation,
          confidenceLevel: evaluation.confidenceLevel,
          signalsJson: JSON.stringify(evaluation.signals),
          missingEvidenceJson: JSON.stringify(evaluation.missingEvidence),
          explanation,
        },
      });

      // 3. Trigger Outbox alerts for tracking rules where targetPrice >= new price
      const matchingRules = await prisma.trackingRule.findMany({
        where: {
          productId: offer.productId,
          status: 'active',
          targetPrice: { gte: price },
        },
        include: { user: true },
      });

      for (const rule of matchingRules) {
        const deduplicationKey = `webhook_alert_${rule.id}_${offer.id}_${Math.round(price)}`;
        await prisma.notificationOutbox.upsert({
          where: { deduplicationKey },
          create: {
            trackingRuleId: rule.id,
            offerId: offer.id,
            eventType: 'price_drop',
            status: 'pending',
            deduplicationKey,
            payload: JSON.stringify({
              userEmail: rule.user.email,
              productTitle: offer.product.title,
              targetPrice: rule.targetPrice,
              currentPrice: price,
              currency: offer.currency,
              merchant,
              savings: rule.targetPrice - price,
              triggeredAt: new Date().toISOString(),
            }),
          },
          update: {},
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Offer updated via merchant webhook',
        previousPrice,
        newPrice: price,
        currency: offer.currency,
        isNewLowest,
        alertsTriggered: matchingRules.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook logged (no existing offer found for externalProductId)',
      externalProductId,
    });
  } catch (error: any) {
    console.error('Merchant webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/merchants',
    supportedEvents: ['price_drop', 'stock_update', 'new_lowest_offer'],
    description: 'Real-time multi-merchant price feed ingestion for DealPilot optimal deal discovery',
  });
}
