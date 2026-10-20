import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/backend/utils/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = await prisma.searchJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Search job not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: job.query, mode: 'insensitive' } },
          { brand: { contains: job.query, mode: 'insensitive' } },
          { category: { contains: job.query, mode: 'insensitive' } },
        ],
      },
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
    });

    return NextResponse.json({ job, products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
