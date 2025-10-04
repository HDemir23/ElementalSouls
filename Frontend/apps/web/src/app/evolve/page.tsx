'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { elementalSoulsAbi } from '@elementalsouls/shared';
import { env } from '@/lib/env.js';

const PLACEHOLDER_URIS = [
  'ipfs://QmPlaceholder1/evolved-1.json',
  'ipfs://QmPlaceholder2/evolved-2.json',
  'ipfs://QmPlaceholder3/evolved-3.json',
];

const EvolvePage = () => {
  const { address } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);

  // For demo, check tokens 1-20
  const tokenIds = Array.from({ length: 20 }, (_, i) => BigInt(i + 1));

  const { data: level } = useReadContract({
    address: env.NEXT_PUBLIC_COLLECTION_ADDRESS as `0x${string}`,
    abi: elementalSoulsAbi,
    functionName: 'levelOf',
    args: selectedTokenId ? [selectedTokenId] : undefined,
    query: { enabled: !!selectedTokenId }
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleEvolve = () => {
    if (!selectedTokenId || level === undefined) return;

    // Placeholder: use tokenId to pick a URI
    const newUri = PLACEHOLDER_URIS[Number(selectedTokenId) % PLACEHOLDER_URIS.length];

    writeContract({
      address: env.NEXT_PUBLIC_GATEWAY_ADDRESS as `0x${string}`,
      abi: [{
        type: 'function',
        name: 'levelUp',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'newUri', type: 'string' }
        ],
        outputs: []
      }],
      functionName: 'levelUp',
      args: [selectedTokenId, newUri]
    });
  };

  return (
    <div className="grid gap-8 max-w-4xl mx-auto">
      <section className="space-y-2">
        <Badge>Evolution</Badge>
        <h2 className="text-3xl font-semibold">Evolve Your Soul</h2>
        <p className="text-muted-foreground">
          Select your NFT and evolve it to the next level
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Your NFTs</CardTitle>
          <CardDescription>Select an NFT to evolve</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {tokenIds.map((tokenId) => (
              <TokenRow
                key={tokenId.toString()}
                tokenId={tokenId}
                address={address}
                onSelect={setSelectedTokenId}
                isSelected={selectedTokenId === tokenId}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTokenId && level !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Evolve Token #{selectedTokenId.toString()}</CardTitle>
            <CardDescription>Current Level: {level.toString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg text-center">
              <p className="text-lg font-semibold">Level {level.toString()} → {Number(level) + 1}</p>
              <p className="text-sm text-muted-foreground mt-2">Evolution will burn current NFT and mint new one</p>
            </div>

            <Button
              onClick={handleEvolve}
              disabled={isPending || isConfirming}
              className="w-full text-lg px-6 py-3"
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Evolving...' : 'Evolve Now'}
            </Button>

            {isSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">✅ Successfully evolved!</p>
                <p className="text-sm text-green-600 mt-1">
                  Your NFT has been upgraded to Level {Number(level) + 1}
                </p>
              </div>
            )}

            {hash && (
              <p className="text-xs text-muted-foreground break-all">
                Transaction: {hash}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const TokenRow = ({
  tokenId,
  address,
  onSelect,
  isSelected
}: {
  tokenId: bigint;
  address: `0x${string}` | undefined;
  onSelect: (id: bigint) => void;
  isSelected: boolean;
}) => {
  const { data: owner } = useReadContract({
    address: env.NEXT_PUBLIC_COLLECTION_ADDRESS as `0x${string}`,
    abi: elementalSoulsAbi,
    functionName: 'ownerOf',
    args: [tokenId]
  });

  const { data: level } = useReadContract({
    address: env.NEXT_PUBLIC_COLLECTION_ADDRESS as `0x${string}`,
    abi: elementalSoulsAbi,
    functionName: 'levelOf',
    args: [tokenId],
    query: { enabled: !!owner }
  });

  if (!owner || !address || owner.toLowerCase() !== address.toLowerCase()) {
    return null;
  }

  return (
    <button
      onClick={() => onSelect(tokenId)}
      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
        isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'
      }`}
    >
      <div className="text-left">
        <p className="font-semibold">Token #{tokenId.toString()}</p>
        <p className="text-sm text-muted-foreground">Level {level?.toString() ?? '0'}</p>
      </div>
      {isSelected && <Badge>Selected</Badge>}
    </button>
  );
};

export default EvolvePage;
