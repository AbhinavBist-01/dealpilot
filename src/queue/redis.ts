import Redis from 'ioredis';
// @ts-ignore
import RedisMock from 'ioredis-mock';

let redisInstance: Redis | null = null;

export function getRedisConnection(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  const useMock = process.env.USE_MOCK_REDIS === 'true' || !process.env.REDIS_HOST;

  if (useMock) {
    // In-memory Redis mock for seamless local development and tests
    redisInstance = new (RedisMock as any)() as unknown as Redis;
    return redisInstance;
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  redisInstance = new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  });

  redisInstance.on('error', (err) => {
    console.warn('[Redis] Connection error, falling back to mock mode if appropriate:', err.message);
  });

  return redisInstance;
}
