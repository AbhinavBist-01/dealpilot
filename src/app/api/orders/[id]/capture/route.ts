import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { payPalService } from '@/services/paypal';

const CaptureSchema = z.object({
  paypalOrderId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = CaptureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.format() }, { status: 400 });
    }

    const { paypalOrderId } = parsed.data;

    const result = await payPalService.captureOrder({
      orderId: params.id,
      paypalOrderId,
    });

    return NextResponse.json({
      success: true,
      order: result.order,
      transaction: result.transaction,
      idempotent: result.idempotent,
    });
  } catch (error: any) {
    console.error('Order capture error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
