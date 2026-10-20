import { NextResponse } from 'next/server';
import prisma from '@/backend/utils/db';
import { getEmailDispatchHistory } from '@/backend/services/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alerts = await prisma.notificationOutbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        trackingRule: {
          include: {
            user: true,
            product: true,
          },
        },
        offer: {
          include: {
            product: true,
          },
        },
      },
    });

    const emailHistory = getEmailDispatchHistory();

    return NextResponse.json({
      alerts,
      emailHistory,
    });
  } catch (error: any) {
    console.error('Error fetching outbox notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch alerts' }, { status: 500 });
  }
}
