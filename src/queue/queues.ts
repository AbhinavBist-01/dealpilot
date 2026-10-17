import { Queue } from 'bullmq';
import { getRedisConnection } from './redis';

const connection = getRedisConnection();

export const discoveryQueue = new Queue('dealpilot-discovery', {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const monitoringQueue = new Queue('dealpilot-monitoring', {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const outboxQueue = new Queue('dealpilot-outbox', {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 500,
    },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
});
