import { describe, expect, it } from 'vitest';
import { getLevelUpDomain, levelUpTypes } from './eip712.js';

describe('level up EIP-712 helpers', () => {
  it('returns stable domain parameters', () => {
    const domain = getLevelUpDomain({
      chainId: 20143,
      verifyingContract: '0x000000000000000000000000000000000000dEaD'
    });

    expect(domain).toEqual({
      name: 'LevelUpGateway',
      version: '1',
      chainId: 20143,
      verifyingContract: '0x000000000000000000000000000000000000dEaD'
    });
  });

  it('exposes LevelUpPermit struct definition', () => {
    expect(levelUpTypes.LevelUpPermit).toContainEqual({
      name: 'tokenId',
      type: 'uint256'
    });
  });
});
