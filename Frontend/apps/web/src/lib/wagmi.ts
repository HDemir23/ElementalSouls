import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { coinbaseWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { env } from '@/lib/env.js';

export const elementalChain = defineChain({
  id: env.NEXT_PUBLIC_CHAIN_ID,
  name: 'ElementalSouls',
  network: 'elemental-souls',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [env.NEXT_PUBLIC_RPC_URL] },
    public: { http: [env.NEXT_PUBLIC_RPC_URL] }
  }
});

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [walletConnectWallet, metaMaskWallet, rainbowWallet, coinbaseWallet]
    }
  ],
  {
    appName: 'ElementalSouls',
    projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  }
);

export const wagmiConfig = createConfig({
  chains: [elementalChain],
  transports: {
    [elementalChain.id]: http(env.NEXT_PUBLIC_RPC_URL)
  },
  connectors
});
