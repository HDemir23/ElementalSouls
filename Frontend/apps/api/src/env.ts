import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv-safe';
import { z } from 'zod';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.join(currentDir, '..');
const envPath = path.join(envDir, '.env');
const examplePath = path.join(envDir, '.env.example');

loadEnv({
  allowEmptyValues: true,
  example: fs.existsSync(examplePath) ? examplePath : undefined,
  path: fs.existsSync(envPath) ? envPath : undefined
});

const hex32 = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/u, 'invalid_hex32');

const address = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/u, 'invalid_address');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    RPC_URL: z.string().url(),
    CHAIN_ID: z.coerce.number().int().positive(),
    COLLECTION_ADDRESS: address,
    GATEWAY_ADDRESS: address,
    OPERATOR_PK: hex32,
    PERMIT_SIGNER_PK: hex32,
    NFT_STORAGE_TOKEN: z.string().min(1),
    AI_PROVIDER: z.enum(['comfy', 'local']).default('local'),
    COMFY_URL: z.string().url().optional(),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    ADMIN_HMAC_KEY: z.string().min(32),
    CORS_ORIGIN: z.string().min(1),
    MAX_IMAGE_MB: z.coerce.number().positive().default(8)
  })
  .superRefine((value, ctx) => {
    if (value.AI_PROVIDER === 'comfy' && !value.COMFY_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COMFY_URL'],
        message: 'COMFY_URL required for comfy provider'
      });
    }
  });

export const env = envSchema.parse(process.env);

export type Env = typeof env;
