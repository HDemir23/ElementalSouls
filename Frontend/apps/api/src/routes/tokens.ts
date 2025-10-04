import type { FastifyInstance } from 'fastify';
import {
  tokensByWalletResponseSchema,
  walletAddressSchema
} from '@elementalsouls/shared';
import { prisma } from '../db/prisma.js';
import { handleError } from '../errors.js';
import { getTokenLevel, getTokenOwner, getTokenUri } from '../services/contracts.js';

export const registerTokenRoutes = async (app: FastifyInstance) => {
  app.get('/tokens/:wallet', async (request, reply) => {
    try {
      const { wallet } = request.params as { wallet: string };
      const parsedWallet = walletAddressSchema.parse(wallet);

      const cached = await prisma.tokenSnapshot.findMany({
        where: { owner: parsedWallet.toLowerCase() }
      });

      const tokens = await Promise.all(
        cached.map(async (token) => {
          const owner = await getTokenOwner(token.tokenId);
          if (owner.toLowerCase() !== parsedWallet.toLowerCase()) {
            return null;
          }

          const level = await getTokenLevel(token.tokenId);
          const uri = await getTokenUri(token.tokenId);
          return {
            tokenId: token.tokenId.toString(),
            owner,
            level,
            uri,
            imageCid: token.imageCid ?? undefined,
            attributes: token.attributes ?? undefined
          };
        })
      );

      const filtered = tokens.filter(Boolean) as Array<{
        tokenId: string;
        owner: `0x${string}`;
        level: number;
        uri: string;
        imageCid?: string;
        attributes?: unknown;
      }>;

      const parsed = tokensByWalletResponseSchema.parse({
        wallet: parsedWallet,
        tokens: filtered
      });

      return reply.send({
        wallet: parsed.wallet,
        tokens: parsed.tokens.map((token) => ({
          tokenId: token.tokenId.toString(),
          owner: token.owner,
          level: token.level,
          uri: token.uri,
          imageCid: token.imageCid,
          attributes: token.attributes
        }))
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });
};
