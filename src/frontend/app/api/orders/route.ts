import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateDemoUser } from '@/backend/utils/user';
import { payPalService } from '@/backend/services/paypal';

const CreateOrderSchema = z.object({
  offerId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateDemoUser();
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.format() }, { status: 400 });
    }

    const { offerId } = parsed.data;
    const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key') || undefined;

    const result = await payPalService.createCheckoutOrder({
      userId: user.id,
      offerId,
      idempotencyKey,
    });

    if (!result.valid) {
      return NextResponse.json({
        error: result.reason,
        revalidationFailed: true,
        currentPrice: result.currentPrice,
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, order: result.order });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
