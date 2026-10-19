import Redis from 'ioredis';
// @ts-ignore
import RedisMock from 'ioredis-mock';

let redisInstance: Redis | null = null;

export function createRedisClient(): Redis {
  const useMock = process.env.USE_MOCK_REDIS === 'true' || !process.env.REDIS_HOST;

  if (useMock) {
    return new (RedisMock as any)() as unknown as Redis;
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  const client = new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  });

  client.on('error', (err) => {
    console.warn('[Redis] Connection warning:', err.message);
  });

  return client;
}

export function getRedisConnection(): Redis {
  if (redisInstance) {
    return redisInstance;
  }
  redisInstance = createRedisClient();
  return redisInstance;
}
