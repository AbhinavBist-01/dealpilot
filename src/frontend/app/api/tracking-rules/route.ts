import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/backend/utils/db';
import { getOrCreateDemoUser } from '@/backend/utils/user';
import { monitoringQueue } from '@/backend/queue/queues';

export const dynamic = 'force-dynamic';

const TrackingRuleCreateSchema = z.object({
  productId: z.string(),
  offerId: z.string().optional(),
  targetPrice: z.number().positive(),
  strategy: z.enum(['target_price', 'best_deal_by_deadline', 'near_historical_low']).default('target_price'),
  deadline: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateDemoUser();
    const body = await req.json();
    const parsed = TrackingRuleCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.format() }, { status: 400 });
    }

    const { productId, offerId, targetPrice, strategy, deadline } = parsed.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create Tracking Rule
    const rule = await prisma.trackingRule.create({
      data: {
        userId: user.id,
        productId,
        offerId,
        targetPrice,
        strategy,
        deadline,
        status: 'active',
        nextCheckAt: new Date(Date.now() + 5000), // check in 5s
      },
      include: {
        product: {
          include: { offers: true },
        },
      },
    });

    // Enqueue in monitoring queue
    try {
      await monitoringQueue.add('dealpilot-monitor-rule', {
        trackingRuleId: rule.id,
      });
    } catch {
      // Ignored if queue is mock
    }

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create tracking rule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getOrCreateDemoUser();
    const rules = await prisma.trackingRule.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            offers: {
              include: {
                evaluations: {
                  orderBy: { evaluatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
