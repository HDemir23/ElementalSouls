import type { Address } from 'viem';
import {
  elementalSoulsAbi,
  levelUpGatewayAbi
} from '@elementalsouls/shared';
import { env } from '../env.js';
import { publicClient, operatorClient, operatorAccount } from '../rpc.js';
import { createError } from '../errors.js';

const collectionAddress = env.COLLECTION_ADDRESS as Address;
const gatewayAddress = env.GATEWAY_ADDRESS as Address;

export const getTokenOwner = async (tokenId: bigint) =>
  (await publicClient.readContract({
    address: collectionAddress,
    abi: elementalSoulsAbi,
    functionName: 'ownerOf',
    args: [tokenId]
  })) as Address;

export const getTokenLevel = async (tokenId: bigint) =>
  Number(
    await publicClient.readContract({
      address: collectionAddress,
      abi: elementalSoulsAbi,
      functionName: 'levelOf',
      args: [tokenId]
    })
  );

export const getTokenUri = async (tokenId: bigint) =>
  (await publicClient.readContract({
    address: collectionAddress,
    abi: elementalSoulsAbi,
    functionName: 'tokenURI',
    args: [tokenId]
  })) as string;

export const getGatewayNonce = async (tokenId: bigint) =>
  BigInt(
    await publicClient.readContract({
      address: gatewayAddress,
      abi: levelUpGatewayAbi,
      functionName: 'nonces',
      args: [tokenId]
    })
  );

export const assertOwner = async (tokenId: bigint, expectedOwner: Address) => {
  const owner = await getTokenOwner(tokenId);
  if (owner.toLowerCase() !== expectedOwner.toLowerCase()) {
    throw createError('forbidden', 'not_token_owner', 403);
  }
  return owner;
};

export const assertLevelUp = async (tokenId: bigint, fromLevel: number, toLevel: number) => {
  const currentLevel = await getTokenLevel(tokenId);
  if (currentLevel !== fromLevel) {
    throw createError('invalid_request', 'level_mismatch', 400);
  }
  if (toLevel !== fromLevel + 1) {
    throw createError('invalid_request', 'invalid_level_up', 400);
  }
  return currentLevel;
};

export const mintTo = async (to: Address, level: number, uri: string) => {
  const simulation = await operatorClient.simulateContract({
    address: collectionAddress,
    abi: elementalSoulsAbi,
    functionName: 'mint',
    args: [to, level, uri],
    account: operatorAccount
  });

  const hash = await operatorClient.writeContract(simulation.request);

  return { hash, tokenId: simulation.result };
};

export const burnToken = async (tokenId: bigint) => {
  const simulation = await operatorClient.simulateContract({
    address: collectionAddress,
    abi: elementalSoulsAbi,
    functionName: 'burn',
    args: [tokenId],
    account: operatorAccount
  });

  return operatorClient.writeContract(simulation.request);
};

export const waitForTransaction = async (hash: `0x${string}`) =>
  publicClient.waitForTransactionReceipt({ hash });
