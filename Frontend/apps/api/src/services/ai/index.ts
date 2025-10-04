import type { ImageGenerateRequest } from '@elementalsouls/shared';
import { env } from '../../env.js';
import { generateWithComfy } from './comfy.js';
import { generateLocalMock } from './local.js';

export interface ImageJobPayload extends ImageGenerateRequest {
  wallet: `0x${string}`;
  jobId: string;
}

export interface ImageJobResult {
  buffer: Buffer;
  mimeType: string;
  prompt: string;
}

export const generateImage = async (payload: ImageJobPayload): Promise<ImageJobResult> => {
  if (env.AI_PROVIDER === 'comfy') {
    return generateWithComfy(payload);
  }

  return generateLocalMock(payload);
};
