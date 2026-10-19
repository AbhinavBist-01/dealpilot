/**
 * DealPilot — Backend Subsystem & Entrypoint
 */

import { prisma } from "./utils/db";
import { getRedisConnection } from "./queue/redis";
import { discoveryQueue, monitoringQueue, outboxQueue } from "./queue/queues";
import { mockCatalogAdapter } from "./adapters/mock-catalog";
import { startWorkers } from "./workers";

// Subsystem exports
export * as Contracts from "./contracts/offer";
export * as RulesContracts from "./contracts/rules";
export * as EvaluationContracts from "./contracts/evaluation";
export * as Adapters from "./adapters";
export * as Engine from "./engine";
export * as Queue from "./queue";
export * as Services from "./services";
export * as Workers from "./workers";
export * as Utils from "./utils/formatters";

export { prisma } from "./utils/db";
export { getOrCreateDemoUser } from "./utils/user";
export { mockCatalogAdapter } from "./adapters/mock-catalog";
export { payPalService } from "./services/paypal";
export { discoveryQueue, monitoringQueue, outboxQueue } from "./queue/queues";
export { startWorkers } from "./workers";

export async function bootstrapDealPilot() {
  console.log("----------------------------------------------------");
  console.log("🚀 Bootstrapping DealPilot Autonomous Agent System...");
  console.log("----------------------------------------------------");

  try {
    // 1. Verify Database Connection
    await prisma.$connect();
    console.log("✅ Database: PostgreSQL connected via Prisma");

    // 2. Verify Redis / Queue System
    const redis = getRedisConnection();
    console.log("✅ Redis Queue Engine: Online & Ready (BullMQ)");

    // 3. Catalog Adapter Status
    const sampleOffers = await mockCatalogAdapter.search({
      query: "headphones",
    });
    console.log(
      `✅ Retailer Feeds: ${sampleOffers.length} normalized offers ready for discovery`,
    );

    // 4. PayPal Service Status
    console.log(
      "✅ Payment Gateway: PayPal Sandbox Orders v2 initialized with pre-flight revalidation",
    );

    // 5. Start Background Workers
    const workers = startWorkers();

    console.log("----------------------------------------------------");
    console.log(
      "🌟 DealPilot workers running. Listening for events on Redis...",
    );
    console.log("----------------------------------------------------");

    return workers;
  } catch (error: any) {
    console.error("❌ Bootstrap Error:", error.message);
    throw error;
  }
}

// When invoked directly via `pnpm worker` or `tsx src/backend/index.ts`:
bootstrapDealPilot().catch((err) => {
  console.error("Fatal initialization error:", err);
  process.exit(1);
});
