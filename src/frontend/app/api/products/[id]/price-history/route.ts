import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/backend/utils/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const observations = await prisma.priceObservation.findMany({
      where: { productId: params.id },
      orderBy: { observedAt: 'asc' },
      take: 100,
    });

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        offers: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      product,
      observations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
