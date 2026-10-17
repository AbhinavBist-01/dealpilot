import { Worker } from 'bullmq';
import { getRedisConnection } from '../queue/redis';
import { processDiscoveryJob } from './discovery-worker';
import { processMonitoringJob } from './monitoring-worker';
import { processOutboxEvent } from '../services/outbox';
import prisma from '../lib/db';

const connection = getRedisConnection();

console.log('🚀 Starting DealPilot Background Workers...');

// 1. Discovery Worker
const discoveryWorker = new Worker(
  'dealpilot-discovery',
  async (job) => {
    return processDiscoveryJob(job as any);
  },
  { connection: connection as any, concurrency: 5 }
);

discoveryWorker.on('completed', (job) => {
  console.log(`[Worker - Discovery] Job ${job.id} completed.`);
});

discoveryWorker.on('failed', (job, err) => {
  console.error(`[Worker - Discovery] Job ${job?.id} failed:`, err.message);
});

// 2. Monitoring Worker
const monitoringWorker = new Worker(
  'dealpilot-monitoring',
  async (job) => {
    return processMonitoringJob(job as any);
  },
  { connection: connection as any, concurrency: 5 }
);

monitoringWorker.on('completed', (job) => {
  console.log(`[Worker - Monitoring] Job ${job.id} completed.`);
});

monitoringWorker.on('failed', (job, err) => {
  console.error(`[Worker - Monitoring] Job ${job?.id} failed:`, err.message);
});

// 3. Periodic Outbox Dispatcher
async function runOutboxDispatcher() {
  try {
    const pendingEvents = await prisma.notificationOutbox.findMany({
      where: { status: 'pending' },
      take: 20,
    });

    for (const event of pendingEvents) {
      await processOutboxEvent(event.id);
    }
  } catch (err: any) {
    console.error('[Outbox Dispatcher] Loop error:', err.message);
  }
}

const outboxInterval = setInterval(runOutboxDispatcher, 5000);

process.on('SIGTERM', async () => {
  console.log('Shutting down background workers...');
  clearInterval(outboxInterval);
  await discoveryWorker.close();
  await monitoringWorker.close();
  process.exit(0);
});
