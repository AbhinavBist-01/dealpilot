import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/backend/utils/db';
import { discoveryQueue } from '@/backend/queue/queues';
import { processDiscoveryJob } from '@/backend/workers/discovery-worker';
import { verifyProductMatch } from '@/backend/engine/product-verifier';

export const dynamic = 'force-dynamic';

const SearchRequestSchema = z.object({
  query: z.string().min(1),
  budget: z.number().positive().optional(),
  targetPrice: z.number().positive().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid search request', details: parsed.error.format() }, { status: 400 });
    }

    const { query, budget, targetPrice, country, currency } = parsed.data;

    // Create search job
    const searchJob = await prisma.searchJob.create({
      data: {
        query,
        budget,
        targetPrice,
        status: 'pending',
      },
    });

    // In local dev/mock queue, also enqueue
    try {
      await discoveryQueue.add('dealpilot-discovery-job', {
        searchJobId: searchJob.id,
        query,
        budget,
        targetPrice,
        country,
        currency,
      });
    } catch {
      // In case BullMQ redis queue is running in standalone mock mode, process directly
    }

    // Direct synchronous processing with discovery worker to fetch real data
    const workerResult = await processDiscoveryJob({
      id: searchJob.id,
      data: {
        searchJobId: searchJob.id,
        query,
        budget,
        targetPrice,
        country,
        currency,
      },
    } as any);

    const updatedJob = await prisma.searchJob.findUnique({
      where: { id: searchJob.id },
    });

    const cleanQuery = query.trim();
    const workerProductIds = workerResult?.productIds || [];

    // Prioritize the exact real products ingested by the worker for this job
    const rawProducts = await prisma.product.findMany({
      where: workerProductIds.length > 0
        ? { id: { in: workerProductIds } }
        : {
            OR: [
              { title: { contains: cleanQuery, mode: 'insensitive' } },
              { brand: { contains: cleanQuery, mode: 'insensitive' } },
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

    // Filter offers strictly by country currency when country or currency is specified
    const targetCurrency = currency || (country ? (country === 'US' ? 'USD' : country === 'GB' ? 'GBP' : country === 'EU' ? 'EUR' : country === 'CA' ? 'CAD' : country === 'AU' ? 'AUD' : 'INR') : undefined);

    const countryFilteredProducts = targetCurrency
      ? rawProducts.map((p) => ({
          ...p,
          offers: p.offers.filter((o) => o.currency.toUpperCase() === targetCurrency.toUpperCase()),
        })).filter((p) => p.offers.length > 0)
      : rawProducts;

    const baseProducts = countryFilteredProducts.length > 0 ? countryFilteredProducts : rawProducts;

    // Verification Gatekeeper: score relevance and filter out accessory mismatches or unrelated items
    const verifiedProducts = baseProducts
      .map((product) => {
        const lowestOfferPrice = product.offers[0]?.totalPrice || product.offers[0]?.itemPrice || 0;
        const verification = verifyProductMatch({
          query: cleanQuery,
          title: product.title,
          brand: product.brand,
          model: product.model,
          category: product.category,
          price: lowestOfferPrice,
        });

        const bestDealScore = product.offers[0]?.evaluations[0]?.score || 50;
        const compositeScore = (verification.relevanceScore * 100) + (bestDealScore * 0.4);

        return {
          ...product,
          verification,
          compositeScore,
        };
      })
      .filter((p) => p.verification.isMatch && !p.verification.isAccessoryMismatch)
      .sort((a, b) => b.compositeScore - a.compositeScore);

    const finalProducts = verifiedProducts.length > 0 ? verifiedProducts : baseProducts;

    return NextResponse.json({
      job: updatedJob,
      products: finalProducts,
      verifiedCount: verifiedProducts.length,
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
