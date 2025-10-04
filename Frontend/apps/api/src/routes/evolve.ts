import type { FastifyInstance } from 'fastify';
import {
  evolvePrepareRequestSchema,
  evolvePrepareResponseSchema,
  type Element
} from '@elementalsouls/shared';
import {
  verifyWalletSignature,
  withIdempotency,
  computeBodyHash
} from '../security.js';
import { handleError, createError } from '../errors.js';
import { prisma } from '../db/prisma.js';
import { acquireTokenLock, releaseTokenLock } from '../services/locks.js';
import { buildEvolvedMetadata } from '../services/metadata.js';
import { putJson } from '../services/ipfs.js';
import {
  assertOwner,
  getTokenLevel,
  burnToken,
  mintTo,
  waitForTransaction
} from '../services/contracts.js';
import { verifyAdminHmac } from '../security.js';
import { z } from 'zod';

const ensureRawBody = (rawBody: string | Buffer | undefined) =>
  typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody ?? Buffer.from('');

export const registerEvolveRoutes = async (app: FastifyInstance) => {
  app.post(
    '/evolve/prepare',
    { config: { rawBody: true } },
    async (request, reply) => {
      try {
        const rawBody = ensureRawBody(request.rawBody);
        const wallet = await verifyWalletSignature(request, rawBody);
        const body = evolvePrepareRequestSchema.parse(request.body);
        const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
        const requestHash = computeBodyHash(rawBody);

        const { reused, payload } = await withIdempotency(
          prisma,
          idempotencyKey,
          requestHash,
          async () => {
            const tokenId = body.tokenId;
            const lock = await acquireTokenLock(tokenId);
            try {
              await assertOwner(tokenId, wallet);
              const currentLevel = await getTokenLevel(tokenId);
              if (body.toLevel !== currentLevel + 1) {
                throw createError('invalid_request', 'invalid_level_up', 400);
              }

              let elementAttr = body.attributes?.find(
                (attr) => attr.trait_type === 'Element' && typeof attr.value === 'string'
              );
              let element = elementAttr?.value;
              if (!element) {
                const snapshot = await prisma.tokenSnapshot.findUnique({ where: { tokenId } });
                element = snapshot?.element;
              }
              if (!element || typeof element !== 'string') {
                throw createError('invalid_request', 'element_required', 400);
              }

              const metadata = buildEvolvedMetadata({
                element: element as Element,
                level: body.toLevel,
                imageCid: body.imageCid,
                attributes: body.attributes
              });
              const newUri = await putJson(metadata);

              await prisma.metadataDraft.upsert({
                where: { uri: newUri },
                create: {
                  uri: newUri,
                  element,
                  level: body.toLevel,
                  imageCid: body.imageCid,
                  attributes: body.attributes ?? []
                },
                update: {
                  element,
                  level: body.toLevel,
                  imageCid: body.imageCid,
                  attributes: body.attributes ?? []
                }
              });

              return {
                tokenId: tokenId.toString(),
                newUri,
                fromLevel: currentLevel,
                toLevel: body.toLevel
              };
            } finally {
              await releaseTokenLock(lock);
            }
          }
        );

        const parsed = evolvePrepareResponseSchema.parse(payload);
        return reply.send({
          tokenId: parsed.tokenId.toString(),
          newUri: parsed.newUri,
          fromLevel: parsed.fromLevel,
          toLevel: parsed.toLevel
        });
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );

  const evolveExecSchema = z.object({
    tokenId: z.bigint().or(
      z
        .string()
        .regex(/^\d+$/u)
        .transform((value) => BigInt(value))
    ),
    wallet: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/u)
      .transform((value) => value as `0x${string}`),
    toLevel: z.number().int().min(1),
    newUri: z.string().min(1)
  });

  app.post(
    '/evolve/exec',
    { config: { rawBody: true } },
    async (request, reply) => {
      try {
        const rawBody = ensureRawBody(request.rawBody);
        verifyAdminHmac(request, rawBody);
        const body = evolveExecSchema.parse(request.body);

        const draft = await prisma.metadataDraft.findUnique({ where: { uri: body.newUri } });
        if (!draft) {
          throw createError('not_found', 'metadata_draft_missing', 404);
        }

        const burnHash = await burnToken(body.tokenId);
        await waitForTransaction(burnHash);

        await prisma.tokenSnapshot.delete({ where: { tokenId: body.tokenId } }).catch(() => undefined);

        const { hash, tokenId: newTokenId } = await mintTo(body.wallet, body.toLevel, body.newUri);
        await waitForTransaction(hash);

        await prisma.tokenSnapshot.upsert({
          where: { tokenId: newTokenId },
          create: {
            tokenId: newTokenId,
            owner: body.wallet.toLowerCase(),
            level: body.toLevel,
            element: draft.element,
            uri: body.newUri,
            imageCid: draft.imageCid,
            attributes: draft.attributes
          },
          update: {
            owner: body.wallet.toLowerCase(),
            level: body.toLevel,
            element: draft.element,
            uri: body.newUri,
            imageCid: draft.imageCid,
            attributes: draft.attributes
          }
        });

        await prisma.metadataDraft.delete({ where: { uri: body.newUri } }).catch(() => undefined);

        return reply.send({
          previousTokenId: body.tokenId.toString(),
          newTokenId: newTokenId.toString(),
          txHash: hash
        });
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
};
