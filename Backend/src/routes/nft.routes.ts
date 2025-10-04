import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { contractService } from '../services/contract.service';
import { signerService } from '../services/signer.service';
import { ipfsService } from '../services/ipfs.service';
import { aiImageService } from '../services/ai-image.service';
import { logger } from '../config/logger';
import type { ElementType } from '../types';

const getNFTSchema = z.object({
  tokenId: z.string().transform(Number),
});

export async function nftRoutes(fastify: FastifyInstance) {
  /**
   * GET /nft/:tokenId
   * Get full NFT data including metadata
   */
  fastify.get('/:tokenId', async (request, reply) => {
    try {
      const { tokenId } = getNFTSchema.parse(request.params);

      const data = await contractService.getExtendedTokenData(BigInt(tokenId));

      // Fetch metadata from IPFS
      let metadata;
      try {
        metadata = await ipfsService.fetchMetadata(data.uri);
      } catch (error) {
        logger.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
        metadata = null;
      }

      return {
        tokenId,
        owner: data.owner,
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
      logger.error('Failed to get NFT data:', error);
      return reply.status(500).send({ error: 'Failed to fetch NFT data' });
    }
  });

  /**
   * GET /nft/user/:address
   * Get all NFTs owned by address
   */
  fastify.get('/user/:address', async (request, reply) => {
    try {
      const { address } = request.params as { address: string };

      const balance = await contractService.getBalance(address as `0x${string}`);

      if (balance === 0n) {
        return { nfts: [], count: 0 };
      }

      // Note: Contract is 1 NFT per address (userMintCount), so balance is either 0 or 1
      // We need to find the tokenId - this would require event indexing or subgraph
      // For now, return that user owns 1 NFT but we'd need tokenId from events

      const mintCount = await contractService.getUserMintCount(address as `0x${string}`);

      return {
        hasMinted: mintCount > 0,
        balance: Number(balance),
        message: 'To get specific tokenId, track Minted event or use subgraph',
      };
    } catch (error) {
      logger.error('Failed to get user NFTs:', error);
      return reply.status(500).send({ error: 'Failed to fetch user NFTs' });
    }
  });

  /**
   * GET /nft/contract/info
   * Get contract information
   */
  fastify.get('/contract/info', async (request, reply) => {
    try {
      const [maxSupply, authorizedSigner, paused, domainSeparator] = await Promise.all([
        contractService.getMaxSupply(),
        contractService.getAuthorizedSigner(),
        contractService.isPaused(),
        contractService.getDomainSeparator(),
      ]);

      return {
        maxSupply,
        authorizedSigner,
        paused,
        domainSeparator,
        signerAddress: signerService.getAddress(),
        signerMatches: authorizedSigner.toLowerCase() === signerService.getAddress().toLowerCase(),
      };
    } catch (error) {
      logger.error('Failed to get contract info:', error);
      return reply.status(500).send({ error: 'Failed to fetch contract info' });
    }
  });

  /**
   * POST /nft/preview-evolution
   * Preview what next evolution will look like (without minting)
   */
  fastify.post('/preview-evolution', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { tokenId } = z.object({
        tokenId: z.number(),
      }).parse(request.body);

      const userAddress = request.user!.address;

      // Get current token data
      const tokenData = await contractService.getExtendedTokenData(BigInt(tokenId));

      // Verify ownership
      if (tokenData.owner.toLowerCase() !== userAddress.toLowerCase()) {
        return reply.status(403).send({ error: 'Not token owner' });
      }

      const nextLevel = tokenData.level + 1;

      if (nextLevel > 10) {
        return reply.status(400).send({ error: 'Already at max level' });
      }

      // Generate preview image
      const imageUrl = await aiImageService.generateEvolutionImage({
        element: tokenData.element as ElementType,
        level: nextLevel,
        tokenId,
      });

      // Create preview metadata (without uploading to IPFS)
      const metadata = aiImageService.createMetadata(
        tokenId,
        tokenData.element as ElementType,
        nextLevel,
        imageUrl,
        tokenData.totalEvolutions + 1
      );

      return {
        currentLevel: tokenData.level,
        nextLevel,
        preview: {
          imageUrl,
          metadata,
        },
        note: 'This is a preview. Actual evolution will generate a new unique image.',
      };
    } catch (error) {
      logger.error('Failed to generate preview:', error);
      return reply.status(500).send({ error: 'Failed to generate preview' });
    }
  });

  /**
   * GET /nft/eip712/domain
   * Get EIP-712 domain separator for frontend signing
   */
  fastify.get('/eip712/domain', async (request, reply) => {
    try {
      const domainSeparator = await contractService.getDomainSeparator();

      return {
        domain: {
          name: 'ElementalSoulsEvolver',
          version: '1',
          chainId: parseInt(process.env.MONAD_CHAIN_ID || '10143'),
          verifyingContract: process.env.CONTRACT_ADDRESS,
        },
        domainSeparator,
        types: {
          EvolvePermit: [
            { name: 'owner', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'fromLevel', type: 'uint8' },
            { name: 'toLevel', type: 'uint8' },
            { name: 'deadline', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'newURI', type: 'string' },
          ],
        },
      };
    } catch (error) {
      logger.error('Failed to get EIP-712 domain:', error);
      return reply.status(500).send({ error: 'Failed to fetch domain' });
    }
  });
}
