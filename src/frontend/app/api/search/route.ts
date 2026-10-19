import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/backend/utils/db';
import { discoveryQueue } from '@/backend/queue/queues';
import { processDiscoveryJob } from '@/backend/workers/discovery-worker';

export const dynamic = 'force-dynamic';

const SearchRequestSchema = z.object({
  query: z.string().min(1),
  budget: z.number().positive().optional(),
  targetPrice: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid search request', details: parsed.error.format() }, { status: 400 });
    }

    const { query, budget, targetPrice } = parsed.data;

    // Create search job
    const searchJob = await prisma.searchJob.create({
      data: {
        query,
        budget,
        targetPrice,
        status: 'pending',
      },
    });

    // In local dev/mock queue, also execute inline or enqueue
    try {
      await discoveryQueue.add('dealpilot-discovery-job', {
        searchJobId: searchJob.id,
        query,
        budget,
        targetPrice,
      });
    } catch {
      // In case BullMQ redis queue is running in standalone mock mode, process directly
    }

    // Direct synchronous processing fallback for instant local interactive demo response
    await processDiscoveryJob({
      id: searchJob.id,
      data: {
        searchJobId: searchJob.id,
        query,
        budget,
        targetPrice,
      },
    } as any);

    const updatedJob = await prisma.searchJob.findUnique({
      where: { id: searchJob.id },
    });

    // Fetch matched products and offers with case-insensitive search
    const cleanQuery = query.trim();
    const searchTerms = cleanQuery.split(/\s+/).filter(Boolean);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { brand: { contains: cleanQuery, mode: 'insensitive' } },
          { category: { contains: cleanQuery, mode: 'insensitive' } },
          { canonicalId: { contains: cleanQuery, mode: 'insensitive' } },
          ...searchTerms.map((term) => ({ title: { contains: term, mode: 'insensitive' as const } })),
          ...searchTerms.map((term) => ({ brand: { contains: term, mode: 'insensitive' as const } })),
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        offers: {
          orderBy: { itemPrice: 'asc' },
          include: {
            evaluations: {
              orderBy: { evaluatedAt: 'desc' },
              take: 1,
            },
            observations: {
              orderBy: { observedAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    return NextResponse.json({
      job: updatedJob,
      products,
    });
  } catch (error: any) {
    console.error('Error starting search job:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const jobs = await prisma.searchJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  return NextResponse.json({ jobs });
}
