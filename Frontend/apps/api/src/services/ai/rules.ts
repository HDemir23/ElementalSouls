import type { Element, ImageMode } from '@elementalsouls/shared';

export interface PromptContext {
  element: Element;
  toLevel: number;
  mode: ImageMode;
  prompt?: string;
}

const elementBasePrompts: Record<Element, string> = {
  Fire: 'A blazing fire elemental spirit surrounded by embers and molten lava',
  Water: 'A graceful water elemental spirit formed of shimmering tides and mist',
  Earth: 'A sturdy earth elemental spirit composed of mossy stone and crystals',
  Air: 'An ethereal air elemental spirit swirling with clouds and astral lights'
};

const elementPalettes: Record<Element, string> = {
  Fire: 'warm orange, red and gold palette',
  Water: 'cool teal, blue and silver palette',
  Earth: 'earthy green, brown and amber palette',
  Air: 'iridescent white, cyan and violet palette'
};

const negativePrompt =
  'text, watermark, deformed, extra limbs, low resolution, disfigured, cropped, frame';

export const buildPrompt = ({ element, toLevel, prompt, mode }: PromptContext) => {
  const base = elementBasePrompts[element];
  const palette = elementPalettes[element];
  const progression = `level ${toLevel} evolution, intricate sigils, cinematic lighting`;
  const strength = mode === 'img2img' ? 'respect base composition' : 'dynamic pose';

  const finalPrompt = [base, palette, progression, strength, prompt]
    .filter(Boolean)
    .join(', ');

  return {
    prompt: finalPrompt,
    negativePrompt
  };
};

export const resolveStrength = (mode: ImageMode, strength?: number) => {
  if (mode === 'img2img') {
    return strength ?? 0.65;
  }
  return undefined;
};
