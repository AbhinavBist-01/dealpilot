import { Job } from 'bullmq';
import prisma from '@/backend/utils/db';
import { mockCatalogAdapter } from '@/backend/adapters/mock-catalog';
import { Channel3CatalogAdapter } from '@/backend/adapters/channel3-catalog';
import { calculateDealScore } from '@/backend/engine/deal-scorer';
import { generateDealExplanation } from '@/backend/services/llm';

export interface DiscoveryJobData {
  searchJobId: string;
  query: string;
  budget?: number;
  targetPrice?: number;
}

export async function processDiscoveryJob(job: Job<DiscoveryJobData>) {
  const { searchJobId, query, budget, targetPrice } = job.data;
  console.log(`[Discovery Worker] Processing job ${job.id} for query "${query}"`);

  await prisma.searchJob.update({
    where: { id: searchJobId },
    data: { status: 'processing' },
  });

  try {
    // 1. Query catalog adapters in parallel (Mock Catalog + Channel3 Commerce Feed)
    const channel3Adapter = new Channel3CatalogAdapter();
    const [mockOffers, channel3Offers] = await Promise.all([
      mockCatalogAdapter.search({ query, maxPrice: budget }),
      channel3Adapter.search({ query, maxPrice: budget }).catch((err) => {
        console.warn('[Discovery Worker] Channel3 adapter failed, continuing with mock offers:', err);
        return [];
      }),
    ]);
    const offers = [...mockOffers, ...channel3Offers];

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
          itemPrice: offerData.price.itemPrice,
          shippingPrice: offerData.price.shippingPrice,
          fees: offerData.price.fees,
          currency: offerData.price.currency,
          totalPrice: offerData.price.totalPrice,
          availabilityStatus: offerData.availabilityStatus,
          freshnessStatus: 'fresh',
          sourceConfidence: offerData.sourceConfidence,
          lastCheckedAt: new Date(),
        },
        update: {
          itemPrice: offerData.price.itemPrice,
          shippingPrice: offerData.price.shippingPrice,
          totalPrice: offerData.price.totalPrice,
          availabilityStatus: offerData.availabilityStatus,
          freshnessStatus: 'fresh',
          lastCheckedAt: new Date(),
        },
      });

      // 4. Record Price Observation
      const obs = await prisma.priceObservation.create({
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
        orderBy: { observedAt: 'desc' },
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

      // 7. Generate fact-based explanation
      const explanation = await generateDealExplanation({
        productTitle: product.title,
        currentPrice: offer.totalPrice,
        targetPrice,
        signals: evaluationResult.signals,
        score: evaluationResult.score,
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
        status: 'completed',
        resultCount: offers.length,
      },
    });

    console.log(`[Discovery Worker] Job ${job.id} completed. Ingested ${offers.length} offers.`);
    return { success: true, count: offers.length };
  } catch (error: any) {
    console.error(`[Discovery Worker] Job ${job.id} failed:`, error);
    await prisma.searchJob.update({
      where: { id: searchJobId },
      data: {
        status: 'failed',
        error: error.message,
      },
    });
    throw error;
  }
}
