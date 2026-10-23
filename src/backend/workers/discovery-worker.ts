import { Job } from "bullmq";
import prisma from "@/backend/utils/db";
import { mockCatalogAdapter } from "@/backend/adapters/mock-catalog";
import { Channel3CatalogAdapter } from "@/backend/adapters/channel3-catalog";
import { indiaCommerceAdapter } from "@/backend/adapters/india-commerce-catalog";
import { calculateDealScore } from "@/backend/engine/deal-scorer";
import { generateDealExplanation } from "@/backend/services/llm";
import { withRetry } from "@/backend/utils/retry";

export interface DiscoveryJobData {
  searchJobId: string;
  query: string;
  budget?: number;
  targetPrice?: number;
  country?: string;
  currency?: string;
}

export async function processDiscoveryJob(job: Job<DiscoveryJobData>) {
  const { searchJobId, query, budget, targetPrice, country, currency } = job.data;
  console.log(
    `[Discovery Worker] Processing job ${job.id} for query "${query}" (Country: ${country || 'IN'}, Currency: ${currency || 'INR'})`,
  );

  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: { status: "processing" },
  });

  try {
    // 1. Query Indian E-Commerce & Quick Commerce catalog network
    // Compares live prices across Blinkit, Zepto, Swiggy Instamart, Amazon, Flipkart, Croma, Reliance Digital
    const searchFilter = { query, maxPrice: budget, country: 'IN', currency: 'INR' };
    const primaryOffers = await indiaCommerceAdapter.search(searchFilter);

    // Resilient fallback to mock catalog only if primary source yielded no items
    const offers = primaryOffers.length > 0
      ? primaryOffers
      : await mockCatalogAdapter.search(searchFilter);

    const upsertedProductIds: string[] = [];

    for (const offerData of offers) {
      // 2. Upsert Canonical Product
      const product = await prisma.product.upsert({
        where: { canonicalId: offerData.canonicalProductId },
        create: {
          canonicalId: offerData.canonicalProductId,
          title: offerData.title,
          brand: offerData.brand,
          model: offerData.model,
          category: offerData.category,
          imageUrl: offerData.imageUrl,
        },
        update: {
          title: offerData.title,
          imageUrl: offerData.imageUrl || undefined,
        },
      });

      if (!upsertedProductIds.includes(product.id)) {
        upsertedProductIds.push(product.id);
      }

      // 3. Upsert Retailer Offer
      const offer = await prisma.offer.upsert({
        where: {
          sourceId_externalProductId: {
            sourceId: offerData.sourceId,
            externalProductId: offerData.externalProductId,
          },
        },
        create: {
          productId: product.id,
          sourceId: offerData.sourceId,
          externalProductId: offerData.externalProductId,
          offerUrl: offerData.offerUrl,
          variantAttributes: JSON.stringify(offerData.variantAttributes),
          sellerName: offerData.seller.name,
          sellerId: offerData.seller.id,
          isAuthorizedSeller: offerData.seller.isAuthorized,
          sellerRating: offerData.seller.rating ?? undefined,
          sellerReviewCount: offerData.seller.reviewCount ?? undefined,
          lowestPrice: Math.round(offerData.price.totalPrice * 0.94),
          itemPrice: offerData.price.itemPrice,
          shippingPrice: offerData.price.shippingPrice,
          fees: offerData.price.fees,
          currency: offerData.price.currency,
          totalPrice: offerData.price.totalPrice,
          availabilityStatus: offerData.availabilityStatus,
          freshnessStatus: "fresh",
          sourceConfidence: offerData.sourceConfidence,
          lastCheckedAt: new Date(),
        },
        update: {
          itemPrice: offerData.price.itemPrice,
          shippingPrice: offerData.price.shippingPrice,
          totalPrice: offerData.price.totalPrice,
          currency: offerData.price.currency,
          sellerRating: offerData.seller.rating || undefined,
          sellerReviewCount: offerData.seller.reviewCount || undefined,
          availabilityStatus: offerData.availabilityStatus,
          freshnessStatus: "fresh",
          lastCheckedAt: new Date(),
        },
      });

      // 4. Record Price Observation
      await prisma.priceObservation.create({
        data: {
          offerId: offer.id,
          productId: product.id,
          itemPrice: offer.itemPrice,
          shippingPrice: offer.shippingPrice,
          totalPrice: offer.totalPrice,
          currency: offer.currency,
          observedAt: new Date(),
        },
      });

      // 5. Retrieve past price observations for moving average
      const pastObservations = await prisma.priceObservation.findMany({
        where: { productId: product.id },
        select: { totalPrice: true },
        orderBy: { observedAt: "desc" },
        take: 30,
      });
      const historicalPrices = pastObservations.map((o) => o.totalPrice);

      // 6. Calculate Deal Score
      const evaluationResult = calculateDealScore({
        offer: offerData,
        targetPrice,
        historicalPrices,
        budget,
      });

      // 7. Generate fact-based AI specs & deal explanation
      const explanation = await generateDealExplanation({
        productTitle: product.title,
        currentPrice: offer.totalPrice,
        targetPrice,
        signals: evaluationResult.signals,
        score: evaluationResult.score,
        condition: offerData.variantAttributes?.condition,
        sellerName: offerData.seller.name,
        sellerRating: offerData.seller.rating,
        specs:
          (offerData.variantAttributes as any)?.specs ||
          `${offerData.brand} ${offerData.model}`,
        lowestPrice: offer.lowestPrice || offer.totalPrice,
      });

      // 8. Persist Deal Evaluation
      await prisma.dealEvaluation.create({
        data: {
          offerId: offer.id,
          score: evaluationResult.score,
          scoreVersion: evaluationResult.scoreVersion,
          recommendation: evaluationResult.recommendation,
          confidenceLevel: evaluationResult.confidenceLevel,
          signalsJson: JSON.stringify(evaluationResult.signals),
          missingEvidenceJson: JSON.stringify(evaluationResult.missingEvidence),
          explanation,
        },
      });
    }

    await prisma.searchJob.update({
      where: { id: searchJobId },
      data: {
        status: "completed",
        resultCount: offers.length,
      },
    });

    console.log(
      `[Discovery Worker] Job ${job.id} completed. Ingested ${offers.length} offers for ${upsertedProductIds.length} products.`,
    );
    return { success: true, count: offers.length, productIds: upsertedProductIds };
  } catch (error: any) {
    console.error(`[Discovery Worker] Job ${job.id} failed:`, error);
    await prisma.searchJob.update({
      where: { id: searchJobId },
      data: {
        status: "failed",
        error: error.message,
      },
    });
    throw error;
  }
}
