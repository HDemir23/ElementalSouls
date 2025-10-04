import type { FastifyInstance } from 'fastify';
import {
  permitLevelUpRequestSchema,
  permitLevelUpResponseSchema
} from '@elementalsouls/shared';
import {
  verifyWalletSignature,
  computeBodyHash,
  withIdempotency
} from '../security.js';
import { handleError, createError } from '../errors.js';
import { prisma } from '../db/prisma.js';
import { assertLevelUp, assertOwner, getGatewayNonce } from '../services/contracts.js';
import { signLevelUpPermit } from '../services/signer.js';

const ensureRawBody = (rawBody: string | Buffer | undefined) =>
  typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody ?? Buffer.from('');

export const registerPermitRoutes = async (app: FastifyInstance) => {
  app.post(
    '/permits/levelup',
    { config: { rawBody: true } },
    async (request, reply) => {
      try {
        const rawBody = ensureRawBody(request.rawBody);
        const wallet = await verifyWalletSignature(request, rawBody);
        const body = permitLevelUpRequestSchema.parse(request.body);
        const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
        const requestHash = computeBodyHash(rawBody);

        const { reused, payload } = await withIdempotency(
          prisma,
          idempotencyKey,
          requestHash,
          async () => {
            const tokenId = body.tokenId;
            await assertOwner(tokenId, wallet);
            await assertLevelUp(tokenId, body.fromLevel, body.toLevel);

            const draft = await prisma.metadataDraft.findUnique({ where: { uri: body.newUri } });
            if (!draft) {
              throw createError('not_found', 'metadata_draft_missing', 404);
            }

            const nonce = await getGatewayNonce(tokenId);
            const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + body.ttlSec);

            const permit = {
              owner: wallet,
              tokenId,
              fromLevel: body.fromLevel,
              toLevel: body.toLevel,
              deadline: deadlineSec,
              nonce,
              newUri: body.newUri
            } as const;

            const { signature, bytesForData } = await signLevelUpPermit(permit);

            const response = permitLevelUpResponseSchema.parse({
              permit,
              signature,
              bytesForData
            });

            return {
              permit: {
                ...response.permit,
                tokenId: response.permit.tokenId.toString(),
                deadline: response.permit.deadline.toString(),
                nonce: response.permit.nonce.toString()
              },
              signature: response.signature,
              bytesForData: response.bytesForData
            };
          }
        );

        return reply.send(payload);
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
};
