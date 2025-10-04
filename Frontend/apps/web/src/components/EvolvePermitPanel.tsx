"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useSignMessage,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { elementalSoulsAbi } from "@elementalsouls/shared";
import type { PermitLevelUpResponse } from "@elementalsouls/shared";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { env } from "@/lib/env.js";
import type { SignedRequestContext } from "@/lib/api.js";
import { api } from "@/lib/api.js";
import { pushToast } from "@/components/TxToast.jsx";

interface Props {
  tokenId: bigint;
  fromLevel: number;
  toLevel: number;
  newUri: string;
  element: string;
  onExecuted: (txHash: `0x${string}`) => void;
}

export const EvolvePermitPanel = ({
  tokenId,
  fromLevel,
  toLevel,
  newUri,
  element,
  onExecuted,
}: Props) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [permitData, setPermitData] = useState<PermitLevelUpResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setRequesting] = useState(false);

  const {
    writeContract,
    data: txHash,
    isPending: isWriting,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const requestPermit = async () => {
    if (!address) {
      setError("Connect your wallet to request a permit.");
      return;
    }
    setError(null);
    setRequesting(true);
    try {
      const context: SignedRequestContext = {
        address,
        signMessage: ({ message }) => signMessageAsync({ message }),
        idempotencyKey: crypto.randomUUID(),
      };

      const permit = await api.requestPermit(
        {
          tokenId,
          fromLevel,
          toLevel,
          newUri,
          ttlSec: 15 * 60,
        },
        context
      );
      setPermitData(permit);
      pushToast({
        title: "Permit signed",
        description: "EIP-712 permit is ready for submission.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request permit");
    } finally {
      setRequesting(false);
    }
  };

  const executeTransfer = async () => {
    if (!address || !permitData) return;
    try {
      setError(null);
      await writeContract({
        address: env.NEXT_PUBLIC_COLLECTION_ADDRESS,
        abi: elementalSoulsAbi,
        functionName: "safeTransferFrom",
        args: [
          address as `0x${string}`,
          env.NEXT_PUBLIC_GATEWAY_ADDRESS,
          tokenId,
          permitData.bytesForData as `0x${string}`,
        ],
      });
      pushToast({
        title: "Transaction submitted",
        description: "Waiting for burn + mint confirmation...",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit transaction"
      );
    }
  };

  useEffect(() => {
    if (isSuccess && txHash) {
      pushToast({
        title: "Evolution confirmed",
        description: `Tx ${txHash.slice(0, 10)}…`,
      });
      onExecuted(txHash);
    }
  }, [isSuccess, txHash, onExecuted]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permit & Transfer</CardTitle>
        <CardDescription>
          Sign a permit and call safeTransferFrom to send your level {fromLevel}{" "}
          {element} soul to the gateway.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={requestPermit} disabled={isRequesting || !address}>
          {isRequesting ? "Requesting..." : "Request level up permit"}
        </Button>
        {permitData && (
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-semibold text-primary">Permit ready</p>
            <p>Nonce: {permitData.permit.nonce.toString()}</p>
            <p>
              Deadline:{" "}
              {new Date(
                Number(permitData.permit.deadline) * 1000
              ).toLocaleString()}
            </p>
          </div>
        )}
        <Button
          variant="outline"
          onClick={executeTransfer}
          disabled={!permitData || isWriting || isConfirming}
        >
          {isConfirming
            ? "Confirming..."
            : isWriting
              ? "Submitting..."
              : "Transfer with permit"}
        </Button>
        {txHash && (
          <p className="text-sm text-muted-foreground">
            Tx hash: <code className="break-all">{txHash}</code>
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
};
