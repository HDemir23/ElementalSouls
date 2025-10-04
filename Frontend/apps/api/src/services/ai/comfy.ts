import { env } from '../../env.js';
import type { Element, ImageMode } from '@elementalsouls/shared';
import { buildPrompt, resolveStrength } from './rules.js';

export interface ComfyImageParams {
  element: Element;
  toLevel: number;
  mode: ImageMode;
  prompt?: string;
  baseCid?: string;
  strength?: number;
  seed?: number;
}

interface ComfyResponse {
  images: Array<{ data: string; mimeType?: string }>;
}

const resolveComfyUrl = (path: string) => {
  if (!env.COMFY_URL) {
    throw new Error('COMFY_URL not configured');
  }
  return new URL(path, env.COMFY_URL).toString();
};

export const generateWithComfy = async ({
  element,
  toLevel,
  mode,
  prompt,
  baseCid,
  strength,
  seed
}: ComfyImageParams) => {
  const { prompt: finalPrompt, negativePrompt } = buildPrompt({ element, toLevel, mode, prompt });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);

  try {
    const response = await fetch(resolveComfyUrl('/prompt'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        workflow: 'elemental-soul-evolution',
        prompt: finalPrompt,
        negativePrompt,
        mode,
        baseCid,
        strength: resolveStrength(mode, strength),
        seed
      })
    });

    if (!response.ok) {
      throw new Error(`comfy_request_failed:${response.status}`);
    }

    const data = (await response.json()) as ComfyResponse;
    const image = data.images?.[0];
    if (!image?.data) {
      throw new Error('comfy_empty_response');
    }

    return {
      buffer: Buffer.from(image.data, 'base64'),
      mimeType: image.mimeType ?? 'image/png',
      prompt: finalPrompt
    };
  } finally {
    clearTimeout(timeout);
  }
};
