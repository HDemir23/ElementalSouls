import { z } from '@/lib/zod.js';

// Inline wallet address schema (avoiding workspace import issues)
const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/).transform((val) => val as `0x${string}`);

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_RPC_URL: z.string().url(),
  NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int(),
  NEXT_PUBLIC_COLLECTION_ADDRESS: walletAddressSchema,
  NEXT_PUBLIC_GATEWAY_ADDRESS: walletAddressSchema,
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().default('elementalsouls-demo')
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_COLLECTION_ADDRESS: process.env.NEXT_PUBLIC_COLLECTION_ADDRESS,
  NEXT_PUBLIC_GATEWAY_ADDRESS: process.env.NEXT_PUBLIC_GATEWAY_ADDRESS,
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
});
