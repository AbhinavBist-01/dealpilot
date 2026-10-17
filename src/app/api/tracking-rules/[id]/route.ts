import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getOrCreateDemoUser } from '@/lib/user';

const UpdateSchema = z.object({
  targetPrice: z.number().positive().optional(),
  status: z.enum(['active', 'paused', 'triggered', 'expired']).optional(),
  deadline: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreateDemoUser();
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.format() }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.trackingRule.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tracking rule not found' }, { status: 404 });
    }

    const updated = await prisma.trackingRule.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, rule: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreateDemoUser();

    const existing = await prisma.trackingRule.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tracking rule not found' }, { status: 404 });
    }

    await prisma.trackingRule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Tracking rule deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
