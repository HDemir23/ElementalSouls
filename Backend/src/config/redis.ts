import Redis from 'ioredis';
import { env } from './env';

// Create a single Redis client to be shared across the application
const redisOptions = {
  host: env.redis.host,
  port: env.redis.port,
  username: env.redis.username || undefined,
  password: env.redis.password || undefined,
  // ioredis options
  lazyConnect: false,
  maxRetriesPerRequest: null as any,
};

const client = new Redis(redisOptions);

client.on('connect', () => {
  console.info('[redis] connected');
});

client.on('ready', () => {
  console.info('[redis] ready');
});

client.on('error', (err) => {
  console.error('[redis] error', err);
});

export default client;
export const getRedis = () => client;