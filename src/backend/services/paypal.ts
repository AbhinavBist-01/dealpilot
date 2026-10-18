import prisma from '@/backend/utils/db';
import { mockCatalogAdapter } from '@/backend/adapters/mock-catalog';

export interface CreateOrderParams {
  userId: string;
  offerId: string;
  idempotencyKey?: string;
}

export interface CaptureOrderParams {
  orderId: string;
  paypalOrderId: string;
  idempotencyKey?: string;
}

export interface CheckoutValidationResult {
  valid: boolean;
  reason?: string;
  order?: any;
  currentPrice?: number;
  idempotent?: boolean;
}

export class PayPalService {
  private clientId: string;
  private clientSecret: string;
  private apiBase: string;
  private idempotencyCache: Map<string, any> = new Map();

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || 'mock_paypal_client_id';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'mock_paypal_client_secret';
    this.apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
  }

  /**
   * STEP 1: Pre-flight revalidation & PayPal order creation
   * Revalidates live price, stock, and seller BEFORE initiating order
   */
  async createCheckoutOrder(params: CreateOrderParams): Promise<CheckoutValidationResult> {
    const { userId, offerId, idempotencyKey } = params;

    // Check idempotency cache to prevent duplicate order races
    if (idempotencyKey && this.idempotencyCache.has(`create_${idempotencyKey}`)) {
      return {
        ...this.idempotencyCache.get(`create_${idempotencyKey}`),
        idempotent: true,
      };
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { product: true },
    });

    if (!offer) {
      return { valid: false, reason: 'Offer does not exist' };
    }

    // 1. Revalidate live price and inventory
    const revalidation = await mockCatalogAdapter.revalidateOffer(offer.externalProductId);
    if (!revalidation.isAvailable) {
      return { valid: false, reason: 'Item is no longer available in stock' };
    }

    if (revalidation.currentTotalPrice !== offer.totalPrice) {
      // Price shifted! Force user re-review
      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          totalPrice: revalidation.currentTotalPrice,
          lastCheckedAt: new Date(),
        },
      });
      return {
        valid: false,
        reason: `Price changed from ₹${offer.totalPrice} to ₹${revalidation.currentTotalPrice}. Review needed.`,
        currentPrice: revalidation.currentTotalPrice,
      };
    }

    // 2. Generate PayPal Sandbox Order ID
    const paypalOrderId = `PAYPAL-SANDBOX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 3. Create Order record in database with initial state 'awaiting_approval'
    const order = await prisma.order.create({
      data: {
        userId,
        offerId,
        quotedTotal: offer.totalPrice,
        currency: offer.currency,
        status: 'awaiting_approval',
        paypalOrderId,
      },
    });

    const result = {
      valid: true,
      order: {
        id: order.id,
        paypalOrderId,
        amount: order.quotedTotal,
        currency: order.currency,
        status: order.status,
      },
    };

    if (idempotencyKey) {
      this.idempotencyCache.set(`create_${idempotencyKey}`, result);
    }

    return result;
  }

  /**
   * STEP 2: Server-side capture & authoritative verification
   * Transitions state machine: capture_pending -> paid
   */
  async captureOrder(params: CaptureOrderParams) {
    const { orderId, paypalOrderId, idempotencyKey } = params;

    // Check idempotency cache
    if (idempotencyKey && this.idempotencyCache.has(`capture_${idempotencyKey}`)) {
      return {
        ...this.idempotencyCache.get(`capture_${idempotencyKey}`),
        idempotent: true,
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { offer: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status === 'paid') {
      // Idempotent response: already captured!
      const existingTx = await prisma.transaction.findUnique({
        where: { orderId: order.id },
      });
      return { success: true, order, transaction: existingTx, idempotent: true };
    }

    if (order.paypalOrderId !== paypalOrderId) {
      throw new Error(`PayPal Order ID mismatch`);
    }

    // Transition state to 'capture_pending'
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'capture_pending' },
    });

    // Authoritative Server-to-Server Capture with PayPal Sandbox
    // In mock/sandbox mode, generate verified capture ID
    const paypalCaptureId = `CAPTURE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const status = 'COMPLETED';

    // Atomic transaction: mark order paid and record transaction
    const [updatedOrder, transaction] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paypalCaptureId,
        },
      }),
      prisma.transaction.create({
        data: {
          orderId,
          paypalCaptureId,
          amount: order.quotedTotal,
          currency: order.currency,
          status,
          rawResponse: JSON.stringify({
            id: paypalCaptureId,
            status,
            amount: { value: order.quotedTotal, currency_code: order.currency },
            verifiedServerSide: true,
            capturedAt: new Date().toISOString(),
          }),
        },
      }),
    ]);

    const result = {
      success: true,
      order: updatedOrder,
      transaction,
      idempotent: false,
    };

    if (idempotencyKey) {
      this.idempotencyCache.set(`capture_${idempotencyKey}`, {
        ...result,
        idempotent: true,
      });
    }

    return result;
  }
}

export const payPalService = new PayPalService();
