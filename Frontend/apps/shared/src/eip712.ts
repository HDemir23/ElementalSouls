import type { Address } from 'viem';

export const LEVEL_UP_DOMAIN_NAME = 'LevelUpGateway';
export const LEVEL_UP_DOMAIN_VERSION = '1';

export interface LevelUpPermit {
  owner: Address;
  tokenId: bigint;
  fromLevel: number;
  toLevel: number;
  deadline: bigint;
  nonce: bigint;
  newUri: string;
}

export const levelUpTypes = {
  LevelUpPermit: [
    { name: 'owner', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'fromLevel', type: 'uint8' },
    { name: 'toLevel', type: 'uint8' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'newUri', type: 'string' }
  ]
} as const;

export type LevelUpTypes = typeof levelUpTypes;

export interface LevelUpDomainParams {
  chainId: number;
  verifyingContract: Address;
}

export const getLevelUpDomain = ({
  chainId,
  verifyingContract
}: LevelUpDomainParams) => ({
  name: LEVEL_UP_DOMAIN_NAME,
  version: LEVEL_UP_DOMAIN_VERSION,
  chainId,
  verifyingContract
});
