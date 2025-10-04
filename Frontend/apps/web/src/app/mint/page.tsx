'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { elementalSoulsAbi } from '@elementalsouls/shared';
import { env } from '@/lib/env.js';

// Pre-uploaded IPFS metadata URIs
const ELEMENT_METADATA: Record<string, string> = {
  'Fire': 'ipfs://bafybeigbcyli4bo6g2b6c3bwirpul5nobhiailfox2lkiepfzstaqrktfe',
  'Water': 'ipfs://bafybeigwa4ee3rddizv2unijvwcbln7ygvtubl3brnuol3ijmutnujx7zm',
  'Earth': 'ipfs://bafybeia3bwsbtdyaarklxejnp5jvx2kbthokfhdzwcquerrjysgg6zxq7a',
  'Air': 'ipfs://bafybeidoluxp77kb75awwbvq5yt2xtpnorrn6rfbnbu64hqwep64xbfady'
};

const ELEMENTS = ['Fire', 'Water', 'Earth', 'Air'] as const;

const MintPage = () => {
  const { address } = useAccount();
  const [selectedElement, setSelectedElement] = useState<string>('Fire');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleMint = () => {
    if (!address) return;

    writeContract({
      address: env.NEXT_PUBLIC_COLLECTION_ADDRESS as `0x${string}`,
      abi: elementalSoulsAbi,
      functionName: 'mint',
      args: [address, 0, ELEMENT_METADATA[selectedElement]]
    });
  };

  return (
    <div className="grid gap-8 max-w-4xl mx-auto">
      <section className="space-y-2">
        <Badge>Mint Your Soul</Badge>
        <h2 className="text-3xl font-semibold">Choose Your Element</h2>
        <p className="text-muted-foreground">
          Select an elemental soul to mint. You can only mint one NFT per wallet.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Select Element</CardTitle>
          <CardDescription>Choose one of the four elemental souls</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ELEMENTS.map((element) => (
            <button
              key={element}
              onClick={() => setSelectedElement(element)}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedElement === element
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="text-4xl mb-2">
                {element === 'Fire' && '🔥'}
                {element === 'Water' && '💧'}
                {element === 'Earth' && '🌍'}
                {element === 'Air' && '💨'}
              </div>
              <div className="font-semibold">{element}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      {selectedElement && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {selectedElement} Soul</CardTitle>
            <CardDescription>Level 0 - Base Element</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-6xl">
              {selectedElement === 'Fire' && '🔥'}
              {selectedElement === 'Water' && '💧'}
              {selectedElement === 'Earth' && '🌍'}
              {selectedElement === 'Air' && '💨'}
            </div>

            {!address ? (
              <p className="text-sm text-muted-foreground">Connect your wallet to mint</p>
            ) : (
              <Button
                onClick={handleMint}
                disabled={isPending || isConfirming}
                className="w-full text-lg px-6 py-3"
              >
                {isPending ? 'Confirm in wallet...' : isConfirming ? 'Minting...' : `Mint ${selectedElement} Soul`}
              </Button>
            )}

            {isSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">✅ Successfully minted!</p>
                <p className="text-sm text-green-600 mt-1">
                  View your NFT in the Profile page
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

export default MintPage;
