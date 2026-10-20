import prisma from '@/backend/utils/db';
import { processOutboxJob } from '../workers/outbox-worker';

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
  try {
    const result = await processOutboxJob({ data: { outboxEventId } });
    return Boolean(result.success);
  } catch (err: any) {
    console.error(`[Notification Engine] Delivery failed for event ${outboxEventId}:`, err);
    return false;
  }
}
