import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/backend/utils/user';
import { executeAgentBuyDirective } from '@/backend/services/agent-directive-engine';

export const dynamic = 'force-dynamic';

const NaturalAgentWatchSchema = z.object({
  prompt: z.string().optional(),
  query: z.string().optional(),
  targetPrice: z.number().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
});

/**
 * Handles autonomous agent buy instructions with tool execution:
 * e.g., "Buy Sony WH-1000XM5 when the price drops to 30000"
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create agent watch directives.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = NaturalAgentWatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const rawPrompt = parsed.data.prompt || `${parsed.data.query || ''} ${parsed.data.targetPrice ? `at ${parsed.data.targetPrice}` : ''}`.trim();

    if (!rawPrompt || rawPrompt.length < 2) {
      return NextResponse.json(
        { error: 'Please specify a product and target price for the agent.' },
        { status: 400 }
      );
    }

    // Execute the Tool-Enabled Agent Directive Engine
    const result = await executeAgentBuyDirective({
      userId: user.id,
      userEmail: user.email,
      userPrompt: rawPrompt,
      country: parsed.data.country || 'IN',
      currency: parsed.data.currency || 'INR',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Agent watch directive error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
