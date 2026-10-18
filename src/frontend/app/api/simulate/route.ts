import { NextRequest, NextResponse } from 'next/server';
import { mockCatalogAdapter } from '@/backend/adapters/mock-catalog';
import { processMonitoringJob } from '@/backend/workers/monitoring-worker';
import prisma from '@/backend/utils/db';

export async function POST(req: NextRequest) {
  try {
    const { action, externalProductId, newPrice } = await req.json();

    if (action === 'drop_price') {
      const targetId = externalProductId || 'mock-sony-xm5-black';
      const price = newPrice || 17499;
      mockCatalogAdapter.updateSimulatedPrice(targetId, price);

      // Also update latest offer record in DB to trigger observations
      await prisma.offer.updateMany({
        where: { externalProductId: targetId },
        data: {
          itemPrice: price,
          totalPrice: price,
          lastCheckedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Simulated price for ${targetId} dropped to ₹${price}`,
      });
    }

    if (action === 'toggle_stock') {
      const targetId = externalProductId || 'mock-sony-xm5-black';
      mockCatalogAdapter.updateSimulatedStock(targetId, 'out_of_stock');

      await prisma.offer.updateMany({
        where: { externalProductId: targetId },
        data: { availabilityStatus: 'out_of_stock', lastCheckedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: `Simulated ${targetId} is now OUT OF STOCK`,
      });
    }

    if (action === 'run_monitor_now') {
      const activeRules = await prisma.trackingRule.findMany({
        where: { status: 'active' },
      });

      const results = [];
      for (const rule of activeRules) {
        const res = await processMonitoringJob({
          id: `manual-${rule.id}-${Date.now()}`,
          data: { trackingRuleId: rule.id },
        } as any);
        results.push({ ruleId: rule.id, res });
      }

      return NextResponse.json({
        success: true,
        message: `Evaluated ${activeRules.length} active tracking rules`,
        results,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
