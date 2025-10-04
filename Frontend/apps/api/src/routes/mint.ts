import type { FastifyInstance } from 'fastify';
import {
  mintPrepareRequestSchema,
  mintPrepareResponseSchema,
  mintExecRequestSchema,
  mintExecResponseSchema
} from '@elementalsouls/shared';
import { verifyAdminHmac } from '../security.js';
import { handleError, createError } from '../errors.js';
import { buildBaseMetadata } from '../services/metadata.js';
import { putJson } from '../services/ipfs.js';
import { mintTo, waitForTransaction } from '../services/contracts.js';
import { prisma } from '../db/prisma.js';

export const registerMintRoutes = async (app: FastifyInstance) => {
  app.post(
    '/mint/prepare',
    { config: { rawBody: true } },
    async (request, reply) => {
      try {
        const rawBody = request.rawBody ?? Buffer.from('');
        verifyAdminHmac(request, rawBody);
        const body = mintPrepareRequestSchema.parse(request.body);
        const metadata = buildBaseMetadata({
          element: body.element,
          level: body.level,
          imageCid: body.imageCid,
          attributes: body.attributes
        });
        const uri = await putJson(metadata);

        await prisma.metadataDraft.upsert({
          where: { uri },
          create: {
            uri,
            element: body.element,
            level: body.level,
            imageCid: body.imageCid,
            attributes: body.attributes ?? []
          },
          update: {
            element: body.element,
            level: body.level,
            imageCid: body.imageCid,
            attributes: body.attributes ?? []
          }
        });
        const response = mintPrepareResponseSchema.parse({ uri });
        return reply.send(response);
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );

  app.post(
    '/mint/exec',
    { config: { rawBody: true } },
    async (request, reply) => {
      try {
        const rawBody = request.rawBody ?? Buffer.from('');
        verifyAdminHmac(request, rawBody);
        const body = mintExecRequestSchema.parse(request.body);
        const draft = await prisma.metadataDraft.findUnique({ where: { uri: body.uri } });
        if (!draft) {
          throw createError('not_found', 'metadata_draft_missing', 404);
        }

        const { hash, tokenId } = await mintTo(body.wallet, body.level, body.uri);
        const receipt = await waitForTransaction(hash);

        await prisma.tokenSnapshot.upsert({
          where: { tokenId },
          create: {
            tokenId,
            owner: body.wallet.toLowerCase(),
            level: body.level,
            element: draft.element,
            uri: body.uri,
            imageCid: draft.imageCid,
            attributes: draft.attributes
          },
          update: {
            owner: body.wallet.toLowerCase(),
            level: body.level,
            element: draft.element,
            uri: body.uri,
            imageCid: draft.imageCid,
            attributes: draft.attributes
          }
        });

        await prisma.metadataDraft.delete({ where: { uri: body.uri } }).catch(() => undefined);

        const parsed = mintExecResponseSchema.parse({ tokenId, txHash: hash });
        return reply.send({
          tokenId: parsed.tokenId.toString(),
          txHash: parsed.txHash,
          blockNumber: receipt.blockNumber.toString()
        });
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
};
