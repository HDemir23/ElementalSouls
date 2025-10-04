import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('elemental_souls'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('password'),

  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/elemental_souls'),

  // Redis (for job queues / caching)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),

  // Smart Contract
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  MONAD_RPC_URL: z.string().url(),
  MONAD_CHAIN_ID: z.string().default('10143'),

  // Signer
  SIGNER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid private key'),

  // AI Services
  REPLICATE_API_TOKEN: z.string().min(1, 'Replicate API token required'),

  // IPFS
  INFURA_IPFS_PROJECT_ID: z.string().min(1, 'Infura IPFS Project ID required'),
  INFURA_IPFS_PROJECT_SECRET: z.string().optional(),
  NFT_STORAGE_API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_WINDOW: z.string().default('60000'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PRETTY_LOGS: z.string().default('true'),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  // Server
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parseInt(parsedEnv.data.PORT),
  host: parsedEnv.data.HOST,
  isDev: parsedEnv.data.NODE_ENV === 'development',
  isProd: parsedEnv.data.NODE_ENV === 'production',

  // Database
  database: {
    url:
      parsedEnv.data.DATABASE_URL ||
      `postgresql://${parsedEnv.data.DB_USER}:${parsedEnv.data.DB_PASSWORD}@${parsedEnv.data.DB_HOST}:${parsedEnv.data.DB_PORT}/${parsedEnv.data.DB_NAME}`,
    host: parsedEnv.data.DB_HOST,
    port: parseInt(parsedEnv.data.DB_PORT),
    name: parsedEnv.data.DB_NAME,
    user: parsedEnv.data.DB_USER,
    password: parsedEnv.data.DB_PASSWORD,
  },

  // MongoDB
  mongodb: {
    uri: parsedEnv.data.MONGODB_URI,
  },

  // Redis
  redis: {
    url: parsedEnv.data.REDIS_URL || undefined,
    host: parsedEnv.data.REDIS_HOST,
    port: parseInt(parsedEnv.data.REDIS_PORT),
    password: parsedEnv.data.REDIS_PASSWORD || undefined,
    username: parsedEnv.data.REDIS_USERNAME || undefined,
  },

  // JWT
  jwtSecret: parsedEnv.data.JWT_SECRET,

  // Smart Contract
  contract: {
    address: parsedEnv.data.CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: parsedEnv.data.MONAD_RPC_URL,
    chainId: parseInt(parsedEnv.data.MONAD_CHAIN_ID),
  },

  // Signer
  signerPrivateKey: parsedEnv.data.SIGNER_PRIVATE_KEY as `0x${string}`,

  // AI Services
  replicate: {
    apiToken: parsedEnv.data.REPLICATE_API_TOKEN,
  },

  // IPFS
  infuraIpfs: {
    projectId: parsedEnv.data.INFURA_IPFS_PROJECT_ID,
    projectSecret: parsedEnv.data.INFURA_IPFS_PROJECT_SECRET,
  },
  nftStorage: {
    apiKey: parsedEnv.data.NFT_STORAGE_API_KEY,
  },

  // Rate Limiting
  rateLimit: {
    max: parseInt(parsedEnv.data.RATE_LIMIT_MAX),
    timeWindow: parseInt(parsedEnv.data.RATE_LIMIT_WINDOW),
  },

  // CORS
  corsOrigin: parsedEnv.data.CORS_ORIGIN.split(','),

  // Logging
  logging: {
    level: parsedEnv.data.LOG_LEVEL,
    pretty: parsedEnv.data.PRETTY_LOGS === 'true',
  },
};
