import crypto from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { Prisma, PrismaClient } from '@prisma/client';
import { recoverMessageAddress } from 'viem';
import { walletAddressSchema, type TokensByWalletResponse } from '@elementalsouls/shared';
import { env } from './env.js';
import { createError } from './errors.js';

export const computeBodyHash = (rawBody: string | Buffer) =>
  crypto.createHash('sha256').update(rawBody).digest('hex');

export const verifyWalletSignature = async (
  request: FastifyRequest,
  rawBody: string | Buffer
) => {
  const walletHeader = request.headers['x-wallet'];
  const signature = request.headers['x-sig'];

  if (typeof walletHeader !== 'string' || typeof signature !== 'string') {
    throw createError('unauthorized', 'missing_auth_headers', 401);
  }

  const wallet = walletAddressSchema.parse(walletHeader);
  const messageHash = computeBodyHash(rawBody);
  const messageBytes = `0x${messageHash}` as const;

  const recovered = await recoverMessageAddress({
    message: { raw: messageBytes },
    signature
  });

  if (recovered.toLowerCase() !== wallet.toLowerCase()) {
    throw createError('unauthorized', 'wallet_mismatch', 401);
  }

  return wallet;
};

export const verifyAdminHmac = (request: FastifyRequest, rawBody: string | Buffer) => {
  const signature = request.headers['x-admin-hmac'];
  if (typeof signature !== 'string') {
    throw createError('unauthorized', 'missing_admin_hmac', 401);
  }

  const computed = crypto
    .createHmac('sha256', env.ADMIN_HMAC_KEY)
    .update(rawBody)
    .digest('hex');

  const providedBuffer = Buffer.from(signature, 'hex');
  const computedBuffer = Buffer.from(computed, 'hex');

  if (providedBuffer.length !== computedBuffer.length) {
    throw createError('unauthorized', 'invalid_admin_hmac', 401);
  }

  if (!crypto.timingSafeEqual(providedBuffer, computedBuffer)) {
    throw createError('unauthorized', 'invalid_admin_hmac', 401);
  }
};

interface IdempotencyResult<T> {
  reused: boolean;
  payload: T;
}

export const withIdempotency = async <T>(
  prisma: PrismaClient,
  key: string | undefined,
  requestHash: string,
  handler: () => Promise<T>
): Promise<IdempotencyResult<T>> => {
  if (!key) {
    return { reused: false, payload: await handler() };
  }

  const existing = await prisma.idempotencyKey.findUnique({
    where: { key }
  });

  if (existing && existing.requestHash !== requestHash) {
    throw createError('conflict', 'idempotency_hash_mismatch', 409);
  }

  if (existing && existing.status === 'COMPLETED' && existing.response) {
    return { reused: true, payload: existing.response as T };
  }

  if (existing && existing.status === 'IN_FLIGHT') {
    throw createError('conflict', 'idempotency_in_flight', 409);
  }

  const record = existing
    ? await prisma.idempotencyKey.update({
        where: { key },
        data: { status: 'IN_FLIGHT' }
      })
    : await prisma.idempotencyKey.create({
        data: { key, requestHash, status: 'IN_FLIGHT' }
      });

  try {
    const payload = await handler();
    await prisma.idempotencyKey.update({
      where: { id: record.id },
      data: {
        status: 'COMPLETED',
        response: payload as unknown as Prisma.JsonValue
      }
    });
    return { reused: false, payload };
  } catch (error) {
    await prisma.idempotencyKey.update({
      where: { id: record.id },
      data: { status: 'FAILED' }
    });
    throw error;
  }
};

export const sanitizeCachedTokens = (tokens: TokensByWalletResponse['tokens']) =>
  tokens.map((token) => ({
    ...token,
    owner: token.owner.toLowerCase() as `0x${string}`
  }));
