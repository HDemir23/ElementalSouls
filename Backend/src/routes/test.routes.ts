import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { aiImageService } from '../services/ai-image.service';
import { ipfsService } from '../services/ipfs.service';
import { contractService } from '../services/contract.service';
import { signerService } from '../services/signer.service';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ELEMENTAL_SOULS_ABI } from '../config/contract-abi';
import type { ElementType } from '../types';

// ⚠️ TEST ONLY - Remove in production
export async function testRoutes(fastify: FastifyInstance) {
  /**
   * POST /test/mint
   * Test mint endpoint (no auth required - for testing only!)
   */
  fastify.post('/mint', async (request, reply) => {
    try {
      const { to, element } = z.object({
        to: z.string(),
        element: z.number().min(0).max(3),
      }).parse(request.body);

      logger.info(`🧪 TEST MINT: Generating NFT for ${to}, element: ${element}`);

      // Generate base image (level 0)
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

      // Mint with backend wallet
      const account = privateKeyToAccount(env.signerPrivateKey);
      const walletClient = createWalletClient({
        account,
        transport: http(env.contract.rpcUrl),
      });

      logger.info(`⛏️ Minting NFT for ${to}...`);

      const txHash = await walletClient.writeContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'mintBase',
        args: [to as `0x${string}`, element, metadataUri],
      });

      logger.info(`✅ Mint tx sent: ${txHash}`);

      // Wait for confirmation (use publicClient for this)
      const receipt = await contractService['publicClient'].waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      // Get token ID from contract (check user's balance)
      // For now, just confirm success
      const balance = await contractService.getBalance(to as `0x${string}`);

      return {
        success: true,
        txHash,
        element,
        metadata: {
          name: metadata.name,
          imageUrl: ipfsService.toGatewayURL(imageUri),
          metadataUri,
        },
        balance: balance.toString(),
        message: 'NFT minted successfully!',
      };
    } catch (error) {
      logger.error('❌ Test mint failed:', error);
      return reply.status(500).send({
        error: 'Test mint failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /test/evolve
   * Test evolve endpoint (no auth required - for testing only!)
   */
  fastify.post('/evolve', async (request, reply) => {
    try {
      const { owner, tokenId, targetLevel } = z.object({
        owner: z.string(),
        tokenId: z.number(),
        targetLevel: z.number(),
      }).parse(request.body);

      logger.info(`🧪 TEST EVOLVE: Token ${tokenId} to level ${targetLevel}`);

      // Get token data
      const tokenData = await contractService.getTokenData(BigInt(tokenId));

      // Verify level progression
      const currentLevel = tokenData.level;
      if (targetLevel !== currentLevel + 1) {
        return reply.status(400).send({ error: 'Invalid level progression' });
      }

      // Generate AI image
      const imageUrl = await aiImageService.generateEvolutionImage({
        element: tokenData.element as ElementType,
        level: targetLevel,
        tokenId,
      });

      // Create metadata
      const metadata = aiImageService.createMetadata(
        tokenId,
        tokenData.element as ElementType,
        targetLevel,
        imageUrl,
        tokenData.totalEvolutions + 1
      );

      // Upload to IPFS
      const { metadataUri, imageUri } = await ipfsService.uploadCompleteNFT(
        imageUrl,
        metadata,
        tokenId,
        targetLevel
      );

      // Create evolution permit
      const permit = signerService.createPermit(
        owner as `0x${string}`,
        BigInt(tokenId),
        currentLevel,
        targetLevel,
        tokenData.nonce,
        metadataUri,
        15 * 60
      );

      // Sign permit
      const signature = await signerService.signEvolvePermit(permit);

      logger.info(`✅ Evolution permit ready for token ${tokenId}`);

      return {
        success: true,
        currentLevel,
        targetLevel,
        permitSignature: {
          permit: {
            owner: permit.owner,
            tokenId: permit.tokenId.toString(),
            fromLevel: permit.fromLevel,
            toLevel: permit.toLevel,
            deadline: permit.deadline.toString(),
            nonce: permit.nonce.toString(),
            newURI: permit.newURI,
          },
          signature,
        },
        preview: {
          imageUrl: ipfsService.toGatewayURL(imageUri),
          metadata,
        },
      };
    } catch (error) {
      logger.error('❌ Test evolve failed:', error);
      return reply.status(500).send({
        error: 'Test evolve failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /test/nft/:tokenId
   * Get NFT data (no auth)
   */
  fastify.get('/nft/:tokenId', async (request, reply) => {
    try {
      const { tokenId } = z.object({
        tokenId: z.string().transform(Number),
      }).parse(request.params);

      const data = await contractService.getTokenData(BigInt(tokenId));

      return {
        tokenId,
        owner: data.owner,
        element: data.element,
        level: data.level,
        metadataUri: data.uri,
        mintedAt: data.mintedAt,
      };
    } catch (error) {
      logger.error('Failed to get NFT data:', error);
      return reply.status(500).send({ error: 'Failed to fetch NFT data' });
    }
  });
}
