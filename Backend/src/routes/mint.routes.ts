import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { contractService } from '../services/contract.service';
import { aiImageService } from '../services/ai-image.service';
import { ipfsService } from '../services/ipfs.service';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ELEMENTAL_SOULS_ABI } from '../config/contract-abi';
import type { ElementType } from '../types';

const mintRequestSchema = z.object({
  element: z.number().min(0).max(3),
});

export async function mintRoutes(fastify: FastifyInstance) {
  /**
   * POST /mint/request
   * Request NFT mint (backend signs and submits transaction)
   */
  fastify.post('/request', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { element } = mintRequestSchema.parse(request.body);
      const userAddress = request.user!.address as `0x${string}`;

      // Check if user already minted
      const mintCount = await contractService.getUserMintCount(userAddress);
      if (mintCount > 0) {
        return reply.status(400).send({ error: 'Already minted' });
      }

      // Check contract not paused
      const paused = await contractService.isPaused();
      if (paused) {
        return reply.status(503).send({ error: 'Minting is currently paused' });
      }

      logger.info(`🎨 Generating base NFT for ${userAddress}, element: ${element}`);

      // Generate base image (level 0 - egg)
      const imageUrl = await aiImageService.generateEvolutionImage({
        element: element as ElementType,
        level: 0,
        tokenId: 0, // Temporary, will get actual tokenId from mint tx
      });

      // Create metadata
      const metadata = aiImageService.createMetadata(
        0, // Temporary tokenId
        element as ElementType,
        0, // Level 0
        imageUrl,
        0 // No evolutions yet
      );

      // Upload to IPFS
      const { metadataUri } = await ipfsService.uploadCompleteNFT(
        imageUrl,
        metadata,
        0,
        0
      );

      // Prepare wallet client for minting
      const account = privateKeyToAccount(env.signerPrivateKey);
      const walletClient = createWalletClient({
        account,
        transport: http(env.contract.rpcUrl),
      });

      // Call mintBase function
      logger.info(`⛏️ Minting base NFT for ${userAddress}...`);

      const txHash = await walletClient.writeContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'mintBase',
        args: [userAddress, element, metadataUri],
      });

      logger.info(`✅ Mint transaction sent: ${txHash}`);

      // Wait for transaction confirmation
      const receipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      // Get user's token (should have exactly 1 now)
      const tokens = await contractService.getTokensOfOwner(userAddress);
      const tokenId = tokens.length > 0 ? Number(tokens[tokens.length - 1]) : null;

      return {
        success: true,
        txHash,
        tokenId,
        message: 'NFT minted successfully!',
        metadata: {
          element,
          level: 0,
          metadataUri,
          imageUrl: ipfsService.toGatewayURL(metadata.image),
        },
      };
    } catch (error) {
      logger.error('Failed to mint NFT:', error);
      return reply.status(500).send({
        error: 'Minting failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /mint/prepare
   * Prepare mint data for user to submit transaction themselves
   */
  fastify.post('/prepare', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { element } = mintRequestSchema.parse(request.body);
      const userAddress = request.user!.address;

      // Check if user already minted
      const mintCount = await contractService.getUserMintCount(userAddress as `0x${string}`);
      if (mintCount > 0) {
        return reply.status(400).send({ error: 'Already minted' });
      }

      logger.info(`🎨 Preparing mint data for ${userAddress}, element: ${element}`);

      // Generate base image
      const imageUrl = await aiImageService.generateEvolutionImage({
        element: element as ElementType,
        level: 0,
        tokenId: 0,
      });

      // Create metadata
      const metadata = aiImageService.createMetadata(
        0,
        element as ElementType,
        0,
        imageUrl,
        0
      );

      // Upload to IPFS
      const { metadataUri, imageUri } = await ipfsService.uploadCompleteNFT(
        imageUrl,
        metadata,
        0,
        0
      );

      return {
        mintData: {
          to: userAddress,
          element,
          uri: metadataUri,
        },
        preview: {
          imageUrl: ipfsService.toGatewayURL(imageUri),
          metadata,
        },
        contractAddress: env.contract.address,
        message: 'Call mint() function with this data from your wallet',
      };
    } catch (error) {
      logger.error('Failed to prepare mint:', error);
      return reply.status(500).send({ error: 'Failed to prepare mint data' });
    }
  });

  /**
   * GET /mint/check/:address
   * Check if address can mint
   */
  fastify.get('/check/:address', async (request, reply) => {
    try {
      const { address } = request.params as { address: string };

      const [mintCount, paused, totalSupply] = await Promise.all([
        contractService.getUserMintCount(address as `0x${string}`),
        contractService.isPaused(),
        contractService.getTotalSupply(),
      ]);

      const canMint = mintCount === 0 && !paused;

      return {
        canMint,
        hasMinted: mintCount > 0,
        isPaused: paused,
        totalSupply: Number(totalSupply),
        reason: !canMint
          ? (mintCount > 0 ? 'Already minted' : 'Contract paused')
          : null,
      };
    } catch (error) {
      logger.error('Failed to check mint eligibility:', error);
      return reply.status(500).send({ error: 'Failed to check eligibility' });
    }
  });
}
