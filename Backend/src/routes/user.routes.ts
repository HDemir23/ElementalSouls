import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth';
import { contractService } from '../services/contract.service';
import { ipfsService } from '../services/ipfs.service';
import { logger } from '../config/logger';

/**
 * GET /user/nft/:tokenId
 * Returns NFT data tailored for frontend user views. If the request includes
 * an Authorization bearer JWT, the response will include `isOwner`.
 */
const tokenIdSchema = z.object({
  tokenId: z.string().transform(Number),
});

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/nft/:tokenId', async (request, reply) => {
    try {
      const { tokenId } = tokenIdSchema.parse(request.params);
      const data = await contractService.getTokenData(BigInt(tokenId));

      // Fetch metadata from IPFS (best-effort)
      let metadata = null;
      try {
        metadata = await ipfsService.fetchMetadata(data.uri);
      } catch (err) {
        logger.warn(`userRoutes: failed to fetch metadata for token ${tokenId}`, err);
      }

      // Attempt to detect authenticated user and ownership (optional)
      let isOwner = false;
      try {
        const authHeader = (request.headers.authorization || '') as string;
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();
          const decoded = fastify.jwt.verify(token) as { address?: string } | null;
          if (decoded && decoded.address) {
            isOwner = decoded.address.toLowerCase() === (data.owner as string).toLowerCase();
          }
        }
      } catch (err) {
        // invalid token - ignore and continue without failing the request
        logger.debug('userRoutes: jwt verify failed (optional):', err);
      }

      return {
        tokenId,
        owner: data.owner,
        isOwner,
        element: data.element,
        level: data.level,
        nonce: data.nonce.toString(),
        metadataUri: data.uri,
        metadata,
        stats: {
          totalEvolutions: data.totalEvolutions,
          lastEvolveTime: data.lastEvolveTime,
        },
      };
    } catch (error) {
      logger.error('userRoutes: failed to fetch NFT data:', error);
      return reply.status(500).send({ error: 'Failed to fetch NFT data' });
    }
  });

  /**
   * GET /user/me/nfts
   * (Optional) Returns basic info about the authenticated user's NFT ownership.
   * This endpoint requires authentication and returns mint/ownership hints.
   */
  fastify.get('/me/nfts', { preHandler: authenticateUser }, async (request, reply) => {
    try {
      const userAddress = (request.user as any).address as string;

      const balance = await contractService.getBalance(userAddress as `0x${string}`);
      const hasMinted = (await contractService.getUserMintCount(userAddress as `0x${string}`)) > 0;

      return {
        address: userAddress,
        balance: Number(balance),
        hasMinted,
        note: 'If you need specific tokenId(s), use event indexing or subgraph. Contract exposes minimal ownership helpers.',
      };
    } catch (error) {
      logger.error('userRoutes: failed to fetch user NFTs:', error);
      return reply.status(500).send({ error: 'Failed to fetch user NFT summary' });
    }
  });
}