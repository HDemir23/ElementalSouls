import IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { env } from '../env.js';
import { createError } from '../errors.js';

const memoryLocks = new Map<string, string>();
let redis: IORedis | null = null;

const getRedis = () => {
  if (env.NODE_ENV === 'test') {
    return null;
  }
  if (!redis) {
    redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null
    });
  }
  return redis;
};

export interface TokenLock {
  key: string;
  value: string;
}

export const acquireTokenLock = async (tokenId: bigint, ttlMs = 30_000): Promise<TokenLock> => {
  const key = `lock:token:${tokenId.toString()}`;
  const value = randomUUID();
  const redisClient = getRedis();

  if (!redisClient) {
    if (memoryLocks.has(key)) {
      throw createError('conflict', 'token_locked', 409);
    }
    memoryLocks.set(key, value);
    return { key, value };
  }

  const acquired = await redisClient.set(key, value, 'PX', ttlMs, 'NX');
  if (!acquired) {
    throw createError('conflict', 'token_locked', 409);
  }
  return { key, value };
};

export const releaseTokenLock = async ({ key, value }: TokenLock) => {
  const redisClient = getRedis();
  if (!redisClient) {
    const current = memoryLocks.get(key);
    if (current === value) {
      memoryLocks.delete(key);
    }
    return;
  }

  const script = `if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end`;
  await redisClient.eval(script, 1, key, value);
};
