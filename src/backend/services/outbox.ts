import prisma from '@/utils/db';

export interface EnqueueOutboxParams {
  trackingRuleId: string;
  offerId: string;
  eventType: 'price_drop' | 'target_hit' | 'deadline_deal';
  observationId: string;
  payload: Record<string, any>;
}

export function generateDeduplicationKey(
  trackingRuleId: string,
  offerId: string,
  eventType: string,
  observationId: string
): string {
  return `${trackingRuleId}:${offerId}:${eventType}:${observationId}`;
}

export async function createOutboxEvent(params: EnqueueOutboxParams) {
  const deduplicationKey = generateDeduplicationKey(
    params.trackingRuleId,
    params.offerId,
    params.eventType,
    params.observationId
  );

  // Atomic insert with deduplication key constraint
  try {
    const event = await prisma.notificationOutbox.create({
      data: {
        trackingRuleId: params.trackingRuleId,
        offerId: params.offerId,
        eventType: params.eventType,
        deduplicationKey,
        payload: JSON.stringify(params.payload),
        status: 'pending',
      },
    });
    return { event, isDuplicate: false };
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Prisma unique constraint violation (duplicate alert avoided!)
      return { event: null, isDuplicate: true };
    }
    throw error;
  }
}

export async function processOutboxEvent(outboxEventId: string): Promise<boolean> {
  const event = await prisma.notificationOutbox.findUnique({
    where: { id: outboxEventId },
    include: {
      offer: {
        include: { product: true },
      },
      trackingRule: {
        include: { user: true },
      },
    },
  });

  if (!event || event.status === 'sent') {
    return false;
  }

  try {
    const payload = JSON.parse(event.payload);

    // Simulated email / push notification dispatch
    console.log(`[Notification Engine] Dispatched alert for Rule ${event.trackingRuleId}:`);
    console.log(`  To: ${event.trackingRule.user?.email || 'user@dealpilot.ai'}`);
    console.log(`  Subject: Price drop on ${event.offer.product.title}`);
    console.log(`  Price: ₹${event.offer.totalPrice} (Target: ₹${event.trackingRule.targetPrice})`);
    console.log(`  Review URL: /review?offerId=${event.offerId}&ruleId=${event.trackingRuleId}`);

    await prisma.notificationOutbox.update({
      where: { id: outboxEventId },
      data: {
        status: 'sent',
        processedAt: new Date(),
      },
    });

    return true;
  } catch (err: any) {
    console.error(`[Notification Engine] Delivery failed for event ${outboxEventId}:`, err);
    await prisma.notificationOutbox.update({
      where: { id: outboxEventId },
      data: {
        status: 'failed',
        retryCount: { increment: 1 },
        lastError: err.message,
      },
    });
    return false;
  }
}
