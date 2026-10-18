import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/backend/utils/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await prisma.searchJob.findUnique({
      where: { id: params.jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Search job not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: job.query } },
          { brand: { contains: job.query } },
          { category: { contains: job.query } },
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
