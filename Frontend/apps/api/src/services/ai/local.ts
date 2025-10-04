import { randomUUID } from 'node:crypto';
import type { Element, ImageMode } from '@elementalsouls/shared';
import { buildPrompt } from './rules.js';

export interface LocalImageParams {
  element: Element;
  toLevel: number;
  mode: ImageMode;
  prompt?: string;
}

const gradients: Record<Element, [string, string]> = {
  Fire: ['#ff6b6b', '#ffd93d'],
  Water: ['#38bdf8', '#1d4ed8'],
  Earth: ['#4ade80', '#16a34a'],
  Air: ['#c084fc', '#60a5fa']
};

export const generateLocalMock = async ({ element, toLevel, mode, prompt }: LocalImageParams) => {
  const [start, end] = gradients[element];
  const { prompt: resolvedPrompt } = buildPrompt({ element, toLevel, mode, prompt });
  const token = randomUUID();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${start}" />
        <stop offset="100%" stop-color="${end}" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#grad)" />
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="64" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${element}</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">Lv.${toLevel}</text>
    <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#ffffff" opacity="0.6" font-family="monospace">${token.slice(0, 8)}</text>
  </svg>`;

  return {
    buffer: Buffer.from(svg),
    mimeType: 'image/svg+xml',
    prompt: resolvedPrompt
  };
};
