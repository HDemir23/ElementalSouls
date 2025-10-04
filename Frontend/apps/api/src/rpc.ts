import { defineChain, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from './env.js';

export const elementalChain = defineChain({
  id: env.CHAIN_ID,
  name: 'ElementalSouls',
  network: 'elemental-souls',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [env.RPC_URL] },
    public: { http: [env.RPC_URL] }
  }
});

export const publicClient = createPublicClient({
  chain: elementalChain,
  transport: http(env.RPC_URL)
});

export const operatorAccount = privateKeyToAccount(env.OPERATOR_PK as `0x${string}`);

export const operatorClient = createWalletClient({
  account: operatorAccount,
  chain: elementalChain,
  transport: http(env.RPC_URL)
});
