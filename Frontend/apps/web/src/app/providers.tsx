'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WagmiConfig } from 'wagmi';
import { TxToast } from '@/components/TxToast.jsx';
import { elementalChain, wagmiConfig } from '@/lib/wagmi.js';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={[elementalChain]}
          theme={lightTheme({ accentColor: '#7c3aed', borderRadius: 'medium' })}
        >
          {children}
          <TxToast />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
};
