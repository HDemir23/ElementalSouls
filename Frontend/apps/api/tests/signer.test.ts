import { describe, expect, it } from 'vitest';
import { decodeAbiParameters, verifyTypedData } from 'viem';
import { getLevelUpDomain, levelUpTypes } from '@elementalsouls/shared';
import { env } from '../src/env.js';
import { getPermitAccountAddress, signLevelUpPermit } from '../src/services/signer.js';

const TUPLE_DEFINITION = [
  {
    name: 'permit',
    type: 'tuple',
    components: [
      { name: 'owner', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'fromLevel', type: 'uint8' },
      { name: 'toLevel', type: 'uint8' },
      { name: 'deadline', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'newUri', type: 'string' }
    ]
  },
  { name: 'signature', type: 'bytes' }
] as const;

describe('signLevelUpPermit', () => {
  it('signs permits that can be verified and decoded', async () => {
    const permit = {
      owner: '0x1111111111111111111111111111111111111111' as `0x${string}`,
      tokenId: 1n,
      fromLevel: 0,
      toLevel: 1,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
      nonce: 0n,
      newUri: 'ipfs://example'
    } as const;

    const { signature, bytesForData } = await signLevelUpPermit(permit);

    const [decodedPermit, decodedSignature] = decodeAbiParameters(TUPLE_DEFINITION, bytesForData);
    expect(decodedSignature).toBe(signature);
    expect(decodedPermit).toMatchObject(permit);

    const domain = getLevelUpDomain({
      chainId: env.CHAIN_ID,
      verifyingContract: env.GATEWAY_ADDRESS as `0x${string}`
    });

    const verified = await verifyTypedData({
      address: getPermitAccountAddress(),
      domain,
      types: levelUpTypes,
      primaryType: 'LevelUpPermit',
      message: permit,
      signature
    });

    expect(verified).toBe(true);
  });
});
