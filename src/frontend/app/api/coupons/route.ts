import { NextRequest, NextResponse } from 'next/server';
import { getApplicableCoupons } from '@/backend/services/coupons';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get('domain') || 'amazon.in';
    const amountStr = req.nextUrl.searchParams.get('amount') || '25000';
    const amount = parseFloat(amountStr) || 25000;

    const result = getApplicableCoupons(domain, amount);

    return NextResponse.json({
      domain,
      orderAmount: amount,
      currency: 'INR',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch coupons' }, { status: 500 });
  }
}
