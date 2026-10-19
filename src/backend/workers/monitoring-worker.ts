import { Job } from 'bullmq';
import prisma from '@/backend/utils/db';
import { mockCatalogAdapter } from '@/backend/adapters/mock-catalog';
import { Channel3CatalogAdapter } from '@/backend/adapters/channel3-catalog';
import { evaluateDeterministicRules } from '@/backend/engine/deal-rules';
import { createOutboxEvent } from '@/backend/services/outbox';
import { NormalizedOffer } from '@/backend/contracts/offer';

export interface MonitoringJobData {
  trackingRuleId: string;
}

export function computeNextCheck(params: {
  currentPrice: number;
  targetPrice: number;
  consecutiveFailures: number;
}): { nextCheckAt: Date; policy: 'normal' | 'near_target' | 'backoff' } {
  const now = Date.now();

  // If failures, back off exponentially
  if (params.consecutiveFailures > 0) {
    const backoffMs = Math.min(Math.pow(2, params.consecutiveFailures) * 5 * 60 * 1000, 12 * 60 * 60 * 1000);
    return {
      nextCheckAt: new Date(now + backoffMs),
      policy: 'backoff',
    };
  }

  // If within 5% of target price, poll every 30 minutes
  const deltaPct = (params.currentPrice - params.targetPrice) / params.targetPrice;
  if (deltaPct <= 0.05) {
    return {
      nextCheckAt: new Date(now + 30 * 60 * 1000), // 30 minutes
      policy: 'near_target',
    };
  }

  // Normal schedule: 2 hours
  return {
    nextCheckAt: new Date(now + 2 * 60 * 60 * 1000),
    policy: 'normal',
  };
}

export async function processMonitoringJob(job: Job<MonitoringJobData>) {
  const { trackingRuleId } = job.data;
  console.log(`[Monitoring Worker] Evaluating rule ${trackingRuleId}`);

  const rule = await prisma.trackingRule.findUnique({
    where: { id: trackingRuleId },
    include: {
      product: {
        include: { offers: true },
      },
    },
  });

  if (!rule || rule.status !== 'active') {
    console.log(`[Monitoring Worker] Rule ${trackingRuleId} is inactive or not found.`);
    return { skipped: true };
  }

  try {
    // Select offer to monitor
    const offer = rule.offerId
      ? rule.product.offers.find((o) => o.id === rule.offerId)
      : rule.product.offers[0];

    if (!offer) {
      console.warn(`[Monitoring Worker] No offer found for rule ${trackingRuleId}`);
      return { skipped: true };
    }

    // 1. Fetch live status from matching adapter (Channel3 or Mock)
    const channel3Adapter = new Channel3CatalogAdapter();
    const adapter = offer.sourceId === 'channel3' ? channel3Adapter : mockCatalogAdapter;
    let live = await adapter.revalidateOffer(offer.externalProductId).catch(() => null);

    // Fallback: If live source is temporarily unavailable (outage guardrail), preserve last observation
    if (!live || !live.offer) {
      console.warn(`[Monitoring Worker] Source refresh unavailable for ${offer.externalProductId}, using last known state.`);
      let variantAttrs: any = {};
      try {
        variantAttrs = typeof offer.variantAttributes === 'string'
          ? JSON.parse(offer.variantAttributes)
          : (offer.variantAttributes || {});
      } catch {
        variantAttrs = {};
      }

      live = {
        offer: {
          sourceId: offer.sourceId,
          externalProductId: offer.externalProductId,
          canonicalProductId: rule.product.canonicalId,
          offerUrl: offer.offerUrl,
          title: rule.product.title,
          brand: rule.product.brand,
          model: rule.product.model,
          category: rule.product.category,
          imageUrl: rule.product.imageUrl || '',
          variantAttributes: variantAttrs,
          seller: {
            id: offer.sellerId || 'seller',
            name: offer.sellerName,
            isAuthorized: offer.isAuthorizedSeller,
            rating: offer.sellerRating || 4.8,
            reviewCount: offer.sellerReviewCount || 100,
          },
          price: {
            itemPrice: offer.itemPrice,
            shippingPrice: offer.shippingPrice,
            fees: offer.fees,
            currency: offer.currency,
            totalPrice: offer.totalPrice,
          },
          availabilityStatus: offer.availabilityStatus as any,
          sourceConfidence: offer.sourceConfidence,
          observedAt: new Date(),
        },
        isAvailable: offer.availabilityStatus === 'in_stock',
        priceChanged: false,
        currentTotalPrice: offer.totalPrice,
      };
    }

    // 2. Record new observation
    const observation = await prisma.priceObservation.create({
      data: {
        offerId: offer.id,
        productId: rule.productId,
        itemPrice: live.offer.price.itemPrice,
        shippingPrice: live.offer.price.shippingPrice,
        totalPrice: live.offer.price.totalPrice,
        currency: live.offer.price.currency,
        observedAt: new Date(),
      },
    });

    // 3. Update Offer record
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        totalPrice: live.offer.price.totalPrice,
        availabilityStatus: live.offer.availabilityStatus,
        freshnessStatus: 'fresh',
        lastCheckedAt: new Date(),
      },
    });

    // 4. Evaluate Deterministic Rules
    const evaluation = evaluateDeterministicRules(live.offer, {
      targetPrice: rule.targetPrice,
      strategy: rule.strategy as any,
      deadline: rule.deadline,
    });

    // 5. If rule is satisfied, record outbox event with deduplication key
    if (evaluation.triggered) {
      const outboxResult = await createOutboxEvent({
        trackingRuleId: rule.id,
        offerId: offer.id,
        eventType: 'target_hit',
        observationId: observation.id,
        payload: {
          productTitle: rule.product.title,
          observedPrice: live.offer.price.totalPrice,
          targetPrice: rule.targetPrice,
          seller: live.offer.seller.name,
          reason: evaluation.reason,
          observedAt: observation.observedAt,
        },
      });

      if (!outboxResult.isDuplicate) {
        console.log(`[Monitoring Worker] Triggered alert created in outbox for rule ${rule.id}`);
        await prisma.trackingRule.update({
          where: { id: rule.id },
          data: {
            status: 'triggered',
            lastTriggeredAt: new Date(),
          },
        });
      }
    }

    // 6. Compute adaptive polling next check
    const { nextCheckAt, policy } = computeNextCheck({
      currentPrice: live.offer.price.totalPrice,
      targetPrice: rule.targetPrice,
      consecutiveFailures: 0,
    });

    await prisma.trackingRule.update({
      where: { id: rule.id },
      data: {
        nextCheckAt,
        lastCheckedAt: new Date(),
        consecutiveFailures: 0,
        pollingPolicy: policy,
      },
    });

    return { success: true, triggered: evaluation.triggered, nextCheckAt, policy };
  } catch (error: any) {
    console.error(`[Monitoring Worker] Error monitoring rule ${trackingRuleId}:`, error.message);

    const { nextCheckAt, policy } = computeNextCheck({
      currentPrice: rule.targetPrice * 2,
      targetPrice: rule.targetPrice,
      consecutiveFailures: rule.consecutiveFailures + 1,
    });

    await prisma.trackingRule.update({
      where: { id: rule.id },
      data: {
        consecutiveFailures: { increment: 1 },
        nextCheckAt,
        pollingPolicy: policy,
      },
    });

    throw error;
  }
}
