'use client';

import {
  evolvePrepareRequestSchema,
  evolvePrepareResponseSchema,
  imageGenerateRequestSchema,
  imageGenerateResponseSchema,
  imageJobStatusSchema,
  permitLevelUpRequestSchema,
  permitLevelUpResponseSchema,
  tokensByWalletResponseSchema,
  type EvolvePrepareRequest,
  type EvolvePrepareResponse,
  type ImageGenerateRequest,
  type ImageGenerateResponse,
  type ImageJobStatusResponse,
  type PermitLevelUpRequest,
  type PermitLevelUpResponse,
  type TokensByWalletResponse
} from '@elementalsouls/shared';
import { z } from '@/lib/zod.js';
import { env } from '@/lib/env.js';

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  `0x${Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}` as const;

const hashJson = async (payload: unknown) => {
  const json = JSON.stringify(payload ?? {});
  const bytes = encoder.encode(json);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(digest);
};

interface SignedContext {
  address: `0x${string}`;
  signMessage: (args: { message: { raw: `0x${string}` } }) => Promise<`0x${string}`>;
  idempotencyKey?: string;
}

interface RequestOptions<TBody, TResult> {
  path: string;
  method: 'GET' | 'POST';
  body?: TBody;
  schema: z.ZodType<TResult>;
  signed?: SignedContext;
  signal?: AbortSignal;
}

const request = async <TBody, TResult>({
  path,
  method,
  body,
  schema,
  signed,
  signal
}: RequestOptions<TBody, TResult>): Promise<TResult> => {
  const url = new URL(path, env.NEXT_PUBLIC_API_URL);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const payload = body !== undefined ? JSON.stringify(body) : undefined;

  if (signed) {
    const hash = await hashJson(body ?? {});
    const signature = await signed.signMessage({ message: { raw: hash } });
    headers.set('x-wallet', signed.address);
    headers.set('x-sig', signature);
    if (signed.idempotencyKey) headers.set('Idempotency-Key', signed.idempotencyKey);
  }

  const res = await fetch(url, {
    method,
    body: method === 'GET' ? undefined : payload,
    headers,
    signal
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? data.message : res.statusText;
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }

  return schema.parse(data);
};

export const api = {
  generateImage: (body: ImageGenerateRequest, signed: SignedContext) =>
    request<ImageGenerateRequest, ImageGenerateResponse>({
      path: 'images/generate',
      method: 'POST',
      body: imageGenerateRequestSchema.parse(body),
      schema: imageGenerateResponseSchema,
      signed
    }),
  getImageJob: (jobId: string, signed: SignedContext) =>
    request<undefined, ImageJobStatusResponse>({
      path: `images/job/${jobId}`,
      method: 'GET',
      schema: imageJobStatusSchema,
      signed
    }),
  evolvePrepare: (body: EvolvePrepareRequest, signed: SignedContext) =>
    request<EvolvePrepareRequest, EvolvePrepareResponse>({
      path: 'evolve/prepare',
      method: 'POST',
      body: evolvePrepareRequestSchema.parse(body),
      schema: evolvePrepareResponseSchema as any,
      signed
    }),
  requestPermit: (body: PermitLevelUpRequest, signed: SignedContext) =>
    request<PermitLevelUpRequest, PermitLevelUpResponse>({
      path: 'permits/levelup',
      method: 'POST',
      body: permitLevelUpRequestSchema.parse(body),
      schema: permitLevelUpResponseSchema as any,
      signed
    }),
  getTokens: (wallet: `0x${string}`) =>
    request<undefined, TokensByWalletResponse>({
      path: `tokens/${wallet}`,
      method: 'GET',
      schema: tokensByWalletResponseSchema as any
    })
};

export type SignedRequestContext = SignedContext;
