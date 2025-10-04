import { encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { LevelUpPermit } from '@elementalsouls/shared';
import { getLevelUpDomain, levelUpTypes } from '@elementalsouls/shared';
import { env } from '../env.js';
import { elementalChain } from '../rpc.js';

const permitAccount = privateKeyToAccount(env.PERMIT_SIGNER_PK as `0x${string}`);

const LEVEL_UP_TUPLE = {
  name: 'permit',
  type: 'tuple' as const,
  components: [
    { name: 'owner', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'fromLevel', type: 'uint8' },
    { name: 'toLevel', type: 'uint8' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'newUri', type: 'string' }
  ]
} as const;

export const signLevelUpPermit = async (permit: LevelUpPermit) => {
  const domain = getLevelUpDomain({
    chainId: elementalChain.id,
    verifyingContract: env.GATEWAY_ADDRESS as `0x${string}`
  });

  const signature = await permitAccount.signTypedData({
    domain,
    types: levelUpTypes,
    primaryType: 'LevelUpPermit',
    message: permit
  });

  const bytesForData = encodeAbiParameters([LEVEL_UP_TUPLE, { name: 'signature', type: 'bytes' }], [permit, signature]);

  return { domain, signature, bytesForData };
};

export const getPermitAccountAddress = () => permitAccount.address;
