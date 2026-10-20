import { NextRequest, NextResponse } from 'next/server';
import { executePayPalAgent } from '@/backend/services/paypal-agent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await executePayPalAgent(message, history || []);

    return NextResponse.json({
      response: result.response,
      toolCalled: result.toolCalled,
      toolResult: result.toolResult,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
