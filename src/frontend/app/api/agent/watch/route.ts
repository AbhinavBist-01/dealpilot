import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/backend/utils/db';
import { getCurrentUser } from '@/backend/utils/user';
import { processDiscoveryJob } from '@/backend/workers/discovery-worker';
import { normalizeOfferPricing } from '@/backend/utils/currency';

export const dynamic = 'force-dynamic';

const NaturalAgentWatchSchema = z.object({
  query: z.string().min(2),
  targetPrice: z.number().positive(),
  country: z.string().optional(),
  currency: z.string().optional(),
});

/**
 * Handles natural language agent buy instructions:
 * e.g., "Buy Sony WH-1000XM5 when the price drops to 18000"
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to create agent watch directives.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = NaturalAgentWatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.format() }, { status: 400 });
    }

    const { query, targetPrice, country = 'IN', currency = 'INR' } = parsed.data;

    // 1. Run discovery worker to locate or ingest matching canonical product
    const searchJob = await prisma.searchJob.create({
      data: {
        query,
        targetPrice,
        status: 'pending',
      },
    });

    const workerResult = await processDiscoveryJob({
      id: searchJob.id,
      data: {
        searchJobId: searchJob.id,
        query,
        targetPrice,
        country,
        currency,
      },
    } as any);

    // 2. Find best product match
    const product = await prisma.product.findFirst({
      where: workerResult?.productIds?.length
        ? { id: { in: workerResult.productIds } }
        : {
            OR: [
              { title: { contains: query.trim(), mode: 'insensitive' } },
              { brand: { contains: query.trim(), mode: 'insensitive' } },
            ],
          },
      include: {
        offers: {
          orderBy: { itemPrice: 'asc' },
          take: 1,
        },
      },
    });

    if (!product) {
      return NextResponse.json({
        error: `Could not find an actionable catalog product matching "${query}". Please check the spelling or search first.`,
      }, { status: 404 });
    }

    const rawOffer = product.offers[0];
    const normalizedOffer = rawOffer ? normalizeOfferPricing(rawOffer, currency, product.title) : null;
    const currentBestPrice = normalizedOffer ? normalizedOffer.itemPrice : targetPrice;
    const isTargetMetInstantly = currentBestPrice <= targetPrice;

    // 3. Create or update active tracking rule for user
    const existingRule = await prisma.trackingRule.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        status: 'active',
      },
    });

    const rule = existingRule
      ? await prisma.trackingRule.update({
          where: { id: existingRule.id },
          data: {
            targetPrice,
            currency,
            pollingPolicy: isTargetMetInstantly ? 'near_target' : 'normal',
            nextCheckAt: new Date(Date.now() + 3000), // Check in 3s
          },
        })
      : await prisma.trackingRule.create({
          data: {
            userId: user.id,
            productId: product.id,
            offerId: product.offers[0]?.id,
            targetPrice,
            currency,
            strategy: 'target_price',
            status: 'active',
            pollingPolicy: isTargetMetInstantly ? 'near_target' : 'normal',
            nextCheckAt: new Date(Date.now() + 3000),
          },
        });

    // 4. If price already meets target, create an immediate outbox notification
    let notificationCreated = false;
    if (isTargetMetInstantly && product.offers[0]) {
      const bestOffer = product.offers[0];
      const deduplicationKey = `agent_prompt_matched_${rule.id}_${bestOffer.id}_${Math.round(currentBestPrice)}`;

      await prisma.notificationOutbox.upsert({
        where: { deduplicationKey },
        create: {
          trackingRuleId: rule.id,
          offerId: bestOffer.id,
          eventType: 'target_hit',
          status: 'pending',
          deduplicationKey,
          payload: JSON.stringify({
            userEmail: user.email,
            productTitle: product.title,
            targetPrice,
            currentPrice: currentBestPrice,
            currency,
            merchant: bestOffer.sellerName,
            savings: targetPrice - currentBestPrice,
            triggeredAt: new Date().toISOString(),
          }),
        },
        update: {},
      });
      notificationCreated = true;
    }

    return NextResponse.json({
      success: true,
      message: isTargetMetInstantly
        ? `Target price matched! Current best price is ${currency} ${currentBestPrice}. Ready to Buy Now.`
        : `Agent monitoring active. I'll watch ${product.title} across retailers and notify you the moment it drops to ${currency} ${targetPrice}.`,
      rule,
      product: {
        id: product.id,
        title: product.title,
        brand: product.brand,
        imageUrl: product.imageUrl,
        currentBestPrice,
        bestOffer: normalizedOffer ? { ...product.offers[0], ...normalizedOffer } : product.offers[0],
      },
      isTargetMet: isTargetMetInstantly,
      notificationCreated,
    });
  } catch (error: any) {
    console.error('Agent watch directive error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
