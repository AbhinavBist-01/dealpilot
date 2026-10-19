import { NextRequest, NextResponse } from 'next/server';
import { executeShoppingCopilot } from '@/backend/services/copilot';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message string is required' }, { status: 400 });
    }

    const result = await executeShoppingCopilot(message, history || []);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Copilot API error:', error);
    return NextResponse.json(
      { error: error.message || 'Copilot failed to process request' },
      { status: 500 }
    );
  }
}
