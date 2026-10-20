import prisma from '../utils/db';
import { sendPriceDropEmail } from '../services/email';

export interface OutboxJobData {
  outboxEventId: string;
}

export async function processOutboxJob(job: { data: OutboxJobData; id?: string }) {
  const { outboxEventId } = job.data;
  console.log(`[Outbox Worker] Processing email dispatch for Outbox Event: ${outboxEventId}`);

  const event = await prisma.notificationOutbox.findUnique({
    where: { id: outboxEventId },
    include: {
      offer: {
        include: {
          product: true,
          evaluations: { orderBy: { evaluatedAt: 'desc' }, take: 1 },
        },
      },
      trackingRule: {
        include: {
          user: true,
          product: true,
        },
      },
    },
  });

  if (!event) {
    throw new Error(`Outbox event ${outboxEventId} not found in database.`);
  }

  if (event.status === 'sent') {
    console.log(`[Outbox Worker] Event ${outboxEventId} already dispatched. Skipping.`);
    return { success: true, alreadyDispatched: true };
  }

  try {
    let payload: any = {};
    try {
      payload = JSON.parse(event.payload);
    } catch {
      payload = {};
    }

    const recipient = event.trackingRule.user?.email || 'shopper@dealpilot.ai';
    const product = event.offer?.product || event.trackingRule?.product;
    const currentPrice = payload.observedPrice ?? event.offer.totalPrice;
    const targetPrice = payload.targetPrice ?? event.trackingRule.targetPrice;
    const evalData = event.offer?.evaluations?.[0];

    let condition = 'Brand New';
    try {
      const attrs = typeof event.offer.variantAttributes === 'string'
        ? JSON.parse(event.offer.variantAttributes)
        : (event.offer.variantAttributes || {});
      if (attrs.condition === 'refurbished' || event.offer.condition === 'refurbished') {
        condition = 'Refurbished';
      }
    } catch {}

    const emailResult = await sendPriceDropEmail({
      to: recipient,
      productTitle: product?.title || 'Tracked Product',
      brand: product?.brand,
      imageUrl: product?.imageUrl,
      currentPrice,
      targetPrice,
      currency: event.offer?.currency || 'INR',
      savings: Math.max(0, targetPrice - currentPrice),
      dropPercentage: targetPrice > 0 ? Math.round(((targetPrice - currentPrice) / targetPrice) * 100) : 0,
      sellerName: payload.seller || event.offer?.sellerName || 'Verified Merchant',
      sellerRating: event.offer?.sellerRating || 4.8,
      dealScore: evalData?.score || 85,
      condition,
      trackingRuleId: event.trackingRuleId,
      offerId: event.offerId,
    });

    await prisma.notificationOutbox.update({
      where: { id: outboxEventId },
      data: {
        status: 'sent',
        processedAt: new Date(),
      },
    });

    console.log(`✅ [Outbox Worker] Successfully dispatched email to ${recipient} (Message ID: ${emailResult.messageId})`);
    return { success: true, emailResult };
  } catch (err: any) {
    console.error(`❌ [Outbox Worker] Failed to dispatch email for outbox event ${outboxEventId}:`, err);

    await prisma.notificationOutbox.update({
      where: { id: outboxEventId },
      data: {
        status: 'failed',
        retryCount: { increment: 1 },
        lastError: err.message,
      },
    });

    throw err;
  }
}
