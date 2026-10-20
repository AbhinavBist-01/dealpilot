import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/backend/utils/db';
import { verifyProductMatch } from '@/backend/engine/product-verifier';

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

    const cleanQuery = job.query.trim();
    const searchTerms = cleanQuery.split(/\s+/).filter((t) => t.length > 2);

    const rawProducts = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { brand: { contains: cleanQuery, mode: 'insensitive' } },
          { category: { contains: cleanQuery, mode: 'insensitive' } },
          ...searchTerms.map((term) => ({ title: { contains: term, mode: 'insensitive' as const } })),
        ],
      },
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

    const verifiedProducts = rawProducts
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

    const finalProducts = verifiedProducts.length > 0 ? verifiedProducts : rawProducts;

    return NextResponse.json({ job, products: finalProducts, verifiedCount: verifiedProducts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
