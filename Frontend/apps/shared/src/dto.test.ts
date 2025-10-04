import { describe, expect, it } from 'vitest';
import {
  elementEnum,
  imageGenerateRequestSchema,
  permitLevelUpRequestSchema
} from './dto.js';

describe('shared dto schemas', () => {
  it('enforces img2img requires baseCid', () => {
    const result = imageGenerateRequestSchema.safeParse({
      element: 'Fire',
      mode: 'img2img',
      toLevel: 2
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid img2img payload', () => {
    const result = imageGenerateRequestSchema.safeParse({
      element: 'Water',
      mode: 'img2img',
      toLevel: 2,
      baseCid: 'ipfs://example'
    });

    expect(result.success).toBe(true);
  });

  it('caps ttlSec', () => {
    const result = permitLevelUpRequestSchema.safeParse({
      tokenId: 1n,
      fromLevel: 0,
      toLevel: 1,
      newUri: 'ipfs://example',
      ttlSec: 4000
    });

    expect(result.success).toBe(false);
  });

  it('provides element enum options', () => {
    expect(elementEnum.options).toEqual(['Fire', 'Water', 'Earth', 'Air']);
  });
});
