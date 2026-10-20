import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/backend/utils/db';
import { sendPriceDropEmail, renderPriceDropEmailHtml } from '@/backend/services/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const recipient = body.recipient || 'shopper@dealpilot.ai';
    const targetPrice = body.targetPrice || 18000;
    const currentPrice = body.currentPrice || 15499;

    // Fetch sample product or create mock data
    const sampleProduct = await prisma.product.findFirst({
      include: {
        offers: {
          include: {
            evaluations: { take: 1 },
          },
        },
      },
    });

    const offer = sampleProduct?.offers?.[0];
    const evalData = offer?.evaluations?.[0];

    const emailData = {
      to: recipient,
      productTitle: sampleProduct?.title || 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
      brand: sampleProduct?.brand || 'Sony',
      imageUrl: sampleProduct?.imageUrl || '',
      currentPrice,
      targetPrice,
      currency: offer?.currency || 'INR',
      savings: targetPrice - currentPrice,
      dropPercentage: Math.round(((targetPrice - currentPrice) / targetPrice) * 100),
      sellerName: offer?.sellerName || 'Verified Merchant',
      sellerRating: offer?.sellerRating || 4.9,
      dealScore: evalData?.score || 92,
      condition: (offer as any)?.condition || 'Brand New',
      trackingRuleId: 'demo-rule-id',
      offerId: offer?.id || 'demo-offer-id',
    };

    if (body.previewOnly) {
      const html = renderPriceDropEmailHtml(emailData);
      return NextResponse.json({
        success: true,
        preview: true,
        html,
        data: emailData,
      });
    }

    const result = await sendPriceDropEmail(emailData);

    return NextResponse.json({
      success: true,
      result,
      data: emailData,
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 });
  }
}
