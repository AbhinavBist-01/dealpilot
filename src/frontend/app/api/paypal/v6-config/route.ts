import { NextResponse } from 'next/server';
import { payPalService } from '@/backend/services/paypal';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await payPalService.generateClientToken();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Failed to get PayPal v6 SDK configuration:', error);
    return NextResponse.json(
      {
        clientId: process.env.PAYPAL_CLIENT_ID || 'mock_paypal_client_id',
        clientToken: `sandbox_token_${Date.now()}`,
        environment: 'sandbox',
        sdkUrl: 'https://www.sandbox.paypal.com/web-sdk/v6/core',
      },
      { status: 200 }
    );
  }
}
