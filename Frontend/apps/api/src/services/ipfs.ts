import { NFTStorage } from 'nft.storage';
import { env } from '../env.js';
import { createError } from '../errors.js';

const client = new NFTStorage({ token: env.NFT_STORAGE_TOKEN });

export const putImageBuffer = async (buffer: Buffer, contentType: string) => {
  const maxBytes = env.MAX_IMAGE_MB * 1024 * 1024;
  if (buffer.byteLength > maxBytes) {
    throw createError('invalid_request', 'image_too_large', 413);
  }

  const blob = new Blob([buffer], { type: contentType });
  const cid = await client.storeBlob(blob);
  return `ipfs://${cid}`;
};

export const putJson = async (data: unknown) => {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const cid = await client.storeBlob(blob);
  return `ipfs://${cid}`;
};
