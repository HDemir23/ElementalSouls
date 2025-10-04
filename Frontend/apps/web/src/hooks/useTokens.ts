'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';

export const useTokens = (wallet?: `0x${string}`) =>
  useQuery({
    queryKey: ['wallet-tokens', wallet],
    enabled: Boolean(wallet),
    queryFn: async () => {
      if (!wallet) throw new Error('Wallet missing');
      return api.getTokens(wallet);
    },
    staleTime: 30_000
  });
