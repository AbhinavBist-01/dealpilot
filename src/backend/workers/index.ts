import { Worker } from 'bullmq';
import { createRedisClient, getRedisConnection } from '../queue/redis';
import { processDiscoveryJob } from './discovery-worker';
import { processMonitoringJob } from './monitoring-worker';
import { processOutboxJob } from './outbox-worker';

export * from './discovery-worker';
export * from './monitoring-worker';
export * from './outbox-worker';

export function startWorkers() {
  console.log('👷 Initializing DealPilot background BullMQ workers...');

  const isMock = process.env.USE_MOCK_REDIS === 'true' || !process.env.REDIS_HOST;
  const connection = isMock ? getRedisConnection() : createRedisClient();

  const discoveryWorker = new Worker(
    'dealpilot-discovery',
    async (job) => {
      console.log(`[DiscoveryWorker] Processing job ${job.id} for query "${job.data?.query}"`);
      return await processDiscoveryJob(job as any);
    },
    { connection: connection as any, concurrency: 5 }
  );

  const monitoringWorker = new Worker(
    'dealpilot-monitoring',
    async (job) => {
      console.log(`[MonitoringWorker] Checking rule ${job.data?.trackingRuleId}`);
      return await processMonitoringJob(job as any);
    },
    { connection: (isMock ? connection : createRedisClient()) as any, concurrency: 5 }
  );

  const outboxWorker = new Worker(
    'dealpilot-outbox',
    async (job) => {
      console.log(`[OutboxWorker] Processing email alert ${job.id}`);
      return await processOutboxJob(job as any);
    },
    { connection: (isMock ? connection : createRedisClient()) as any, concurrency: 5 }
  );

  discoveryWorker.on('completed', (job) => {
    console.log(`✅ [DiscoveryWorker] Job ${job.id} completed successfully`);
  });

  discoveryWorker.on('failed', (job, err) => {
    console.error(`❌ [DiscoveryWorker] Job ${job?.id} failed:`, err.message);
  });

  monitoringWorker.on('completed', (job) => {
    console.log(`✅ [MonitoringWorker] Job ${job.id} completed successfully`);
  });

  monitoringWorker.on('failed', (job, err) => {
    console.error(`❌ [MonitoringWorker] Job ${job?.id} failed:`, err.message);
  });

  outboxWorker.on('completed', (job) => {
    console.log(`✅ [OutboxWorker] Email alert job ${job.id} sent successfully`);
  });

  outboxWorker.on('failed', (job, err) => {
    console.error(`❌ [OutboxWorker] Email alert job ${job?.id} failed:`, err.message);
  });

  console.log('🚀 BullMQ Workers active: [dealpilot-discovery, dealpilot-monitoring, dealpilot-outbox] listening on Redis 7');

  return { discoveryWorker, monitoringWorker, outboxWorker };
}
