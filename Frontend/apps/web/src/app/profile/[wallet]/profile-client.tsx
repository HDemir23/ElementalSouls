'use client';

import { useAccount, useReadContract } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { elementalSoulsAbi } from '@elementalsouls/shared';
import { env } from '@/lib/env.js';
import Link from 'next/link';

interface Props {
  wallet: `0x${string}`;
}

const ELEMENT_NAMES = ['Fire', 'Water', 'Earth', 'Air'];
const ELEMENT_EMOJIS: Record<string, string> = {
  'Fire': '🔥',
  'Water': '💧',
  'Earth': '🌍',
  'Air': '💨'
};

export const ProfileClient = ({ wallet }: Props) => {
  const { address } = useAccount();
  const isOwnProfile = address?.toLowerCase() === wallet.toLowerCase();

  // Simple approach: check token IDs 1-100 (adjust range as needed)
  const tokenIds = Array.from({ length: 100 }, (_, i) => BigInt(i + 1));

  return (
    <div className="grid gap-6">
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold">
          {isOwnProfile ? 'My NFTs' : `Wallet ${wallet.slice(0, 6)}…${wallet.slice(-4)}`}
        </h2>
        <p className="text-muted-foreground">Your Elemental Souls collection</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tokenIds.map((tokenId) => (
          <TokenCard key={tokenId.toString()} tokenId={tokenId} targetWallet={wallet} />
        ))}
      </div>
    </div>
  );
};

const TokenCard = ({ tokenId, targetWallet }: { tokenId: bigint; targetWallet: string }) => {
  const { data: owner } = useReadContract({
    address: env.NEXT_PUBLIC_COLLECTION_ADDRESS as `0x${string}`,
    abi: elementalSoulsAbi,
    functionName: 'ownerOf',
    args: [tokenId],
    query: { enabled: true }
  });

  const { data: level } = useReadContract({
    address: env.NEXT_PUBLIC_COLLECTION_ADDRESS as `0x${string}`,
    abi: elementalSoulsAbi,
    functionName: 'levelOf',
    args: [tokenId],
    query: { enabled: !!owner }
  });

  const { data: uri } = useReadContract({
    address: env.NEXT_PUBLIC_COLLECTION_ADDRESS as `0x${string}`,
    abi: elementalSoulsAbi,
    functionName: 'tokenURI',
    args: [tokenId],
    query: { enabled: !!owner }
  });

  // Only show if this token belongs to the target wallet
  if (!owner || owner.toLowerCase() !== targetWallet.toLowerCase()) {
    return null;
  }

  // Infer element from tokenId (simple heuristic for demo)
  const elementIndex = Number(tokenId) % 4;
  const element = ELEMENT_NAMES[elementIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{ELEMENT_EMOJIS[element]}</span>
          Token #{tokenId.toString()}
        </CardTitle>
        <CardDescription>Level {level?.toString() ?? '0'} - {element}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-6xl">
          {ELEMENT_EMOJIS[element]}
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            URI: <code className="text-xs break-all">{uri?.toString().slice(0, 40)}...</code>
          </p>
        </div>
        <Button variant="outline" className="w-full">
          <Link href="/evolve">Evolve →</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
