import { describe, expect, it } from 'vitest';
import { buildBaseMetadata, buildEvolvedMetadata } from '../src/services/metadata.js';
import { buildPrompt } from '../src/services/ai/rules.js';

describe('metadata builders', () => {
  it('merges custom attributes without overriding element and level', () => {
    const metadata = buildBaseMetadata({
      element: 'Fire',
      level: 1,
      imageCid: 'ipfs://cid',
      attributes: [{ trait_type: 'Artist', value: 'LLM' }]
    });

    expect(metadata.attributes).toEqual([
      { trait_type: 'Element', value: 'Fire' },
      { trait_type: 'Level', value: 1 },
      { trait_type: 'Artist', value: 'LLM' }
    ]);
  });

  it('builds evolved metadata using same helper', () => {
    const evolved = buildEvolvedMetadata({
      element: 'Water',
      level: 2,
      imageCid: 'ipfs://cid2'
    });

    expect(evolved.name).toContain('Lv.2');
    expect(evolved.image).toBe('ipfs://cid2');
  });
});

describe('prompt rules', () => {
  it('creates prompts with element flavor and requested level', () => {
    const { prompt, negativePrompt } = buildPrompt({
      element: 'Earth',
      toLevel: 3,
      mode: 'txt2img'
    });

    expect(prompt).toContain('Earth');
    expect(prompt).toContain('level 3');
    expect(negativePrompt).toContain('watermark');
  });
});
