import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db/client';
import { contractService } from '../services/contract.service';
import { signerService } from '../services/signer.service';
import { aiImageService } from '../services/ai-image.service';
import { ipfsService } from '../services/ipfs.service';
import { logger } from '../config/logger';
import type { ElementType } from '../types';

const checkEligibilitySchema = z.object({
  tokenId: z.number(),
});

const requestEvolutionSchema = z.object({
  tokenId: z.number(),
  targetLevel: z.number(),
});

// Task requirements per level
const LEVEL_REQUIREMENTS: Record<number, number> = {
  0: 0, 1: 3, 2: 5, 3: 7, 4: 10, 5: 12,
  6: 15, 7: 18, 8: 22, 9: 25, 10: 30,
};

export async function evolutionRoutes(fastify: FastifyInstance) {
  /**
   * POST /evolution/check-eligibility
   * Check if user can evolve their NFT
   */
  fastify.post('/check-eligibility', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { tokenId } = checkEligibilitySchema.parse(request.body);
      const userAddress = request.user!.address;

      // Get token data from blockchain
      const tokenData = await contractService.getTokenData(BigInt(tokenId));

      // Verify ownership
      if (tokenData.owner.toLowerCase() !== userAddress.toLowerCase()) {
        return reply.status(403).send({ error: 'Not token owner' });
      }

      const currentLevel = tokenData.level;
      const nextLevel = currentLevel + 1;

      // Check if max level reached
      if (currentLevel >= 10) {
        return {
          eligible: false,
          currentLevel,
          nextLevel: currentLevel,
          requirements: {
            totalTasksNeeded: 0,
            completedTasks: 0,
            missingTasks: [],
          },
          message: 'Maximum level reached',
        };
      }

      // Get completed tasks count
      const result = await db.query(
        `SELECT COUNT(*) as count FROM task_completions
         WHERE user_address = $1 AND status = 'approved'`,
        [userAddress]
      );

      const completedTasks = parseInt(result.rows[0].count);
      const tasksNeeded = LEVEL_REQUIREMENTS[nextLevel] || 0;

      // Get missing tasks if not eligible
      const missingTasks: string[] = [];
      if (completedTasks < tasksNeeded) {
        const missingResult = await db.query(
          `SELECT id FROM tasks
           WHERE required_level <= $1
           AND is_active = true
           AND id NOT IN (
             SELECT task_id FROM task_completions
             WHERE user_address = $2 AND status = 'approved'
           )
           LIMIT $3`,
          [currentLevel, userAddress, tasksNeeded - completedTasks]
        );
        missingTasks.push(...missingResult.rows.map(r => r.id));
      }

      return {
        eligible: completedTasks >= tasksNeeded,
        currentLevel,
        nextLevel,
        requirements: {
          totalTasksNeeded: tasksNeeded,
          completedTasks,
          missingTasks,
        },
      };
    } catch (error) {
      logger.error('Failed to check eligibility:', error);
      return reply.status(500).send({ error: 'Failed to check eligibility' });
    }
  });

  /**
   * POST /evolution/request
   * Request evolution and generate AI image
   */
  fastify.post('/request', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { tokenId, targetLevel } = requestEvolutionSchema.parse(request.body);
      const userAddress = request.user!.address;

      // Get token data
      const tokenData = await contractService.getTokenData(BigInt(tokenId));

      // Verify ownership
      if (tokenData.owner.toLowerCase() !== userAddress.toLowerCase()) {
        return reply.status(403).send({ error: 'Not token owner' });
      }

      const currentLevel = tokenData.level;

      // Verify level progression
      if (targetLevel !== currentLevel + 1) {
        return reply.status(400).send({ error: 'Invalid level progression' });
      }

      // Check eligibility
      const result = await db.query(
        `SELECT COUNT(*) as count FROM task_completions
         WHERE user_address = $1 AND status = 'approved'`,
        [userAddress]
      );

      const completedTasks = parseInt(result.rows[0].count);
      const tasksNeeded = LEVEL_REQUIREMENTS[targetLevel] || 0;

      if (completedTasks < tasksNeeded) {
        return reply.status(400).send({
          error: 'INSUFFICIENT_TASKS',
          message: `You need ${tasksNeeded - completedTasks} more tasks to evolve`,
        });
      }

      // Generate AI image
      logger.info(`🎨 Starting evolution for token ${tokenId} to level ${targetLevel}`);

      const imageUrl = await aiImageService.generateEvolutionImage({
        element: tokenData.element as ElementType,
        level: targetLevel,
        tokenId,
      });

      // Create metadata (use targetLevel as evolution count)
      const metadata = aiImageService.createMetadata(
        tokenId,
        tokenData.element as ElementType,
        targetLevel,
        imageUrl,
        targetLevel // Evolution count = level
      );

      // Upload to IPFS
      const { imageUri, metadataUri } = await ipfsService.uploadCompleteNFT(
        imageUrl,
        metadata,
        tokenId,
        targetLevel
      );

      // Record evolution in history (before user submits tx)
      await db.query(
        `INSERT INTO evolution_history (token_id, from_level, to_level, metadata_uri, image_uri)
         VALUES ($1, $2, $3, $4, $5)`,
        [tokenId, currentLevel, targetLevel, metadataUri, imageUri]
      );

      logger.info(`✅ Evolution ready for token ${tokenId}. User should call evolve(${tokenId}, "${metadataUri}")`);

      return {
        status: 'ready',
        evolutionData: {
          oldTokenId: tokenId,
          newUri: metadataUri,
          fromLevel: currentLevel,
          toLevel: targetLevel,
        },
        preview: {
          imageUrl: ipfsService.toGatewayURL(imageUri),
          metadata,
        },
        instructions: 'Call evolve(oldTokenId, newUri) from your wallet to complete evolution',
      };
    } catch (error) {
      logger.error('Failed to process evolution:', error);
      return reply.status(500).send({ error: 'Evolution failed' });
    }
  });

  /**
   * GET /evolution/history/:tokenId
   * Get evolution history for a token
   */
  fastify.get('/history/:tokenId', async (request, reply) => {
    try {
      const { tokenId } = request.params as { tokenId: string };

      const result = await db.query(
        `SELECT * FROM evolution_history
         WHERE token_id = $1
         ORDER BY evolved_at ASC`,
        [parseInt(tokenId)]
      );

      return {
        history: result.rows.map(row => ({
          id: row.id,
          fromLevel: row.from_level,
          toLevel: row.to_level,
          metadataUri: row.metadata_uri,
          imageUrl: ipfsService.toGatewayURL(row.image_uri),
          txHash: row.tx_hash,
          evolvedAt: row.evolved_at,
        })),
      };
    } catch (error) {
      logger.error('Failed to fetch evolution history:', error);
      return reply.status(500).send({ error: 'Failed to fetch history' });
    }
  });

  /**
   * POST /evolution/confirm
   * Confirm evolution transaction (update with tx hash)
   */
  fastify.post('/confirm', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { tokenId, txHash } = z.object({
        tokenId: z.number(),
        txHash: z.string(),
      }).parse(request.body);

      // Update latest evolution with tx hash
      await db.query(
        `UPDATE evolution_history
         SET tx_hash = $1
         WHERE token_id = $2
         AND id = (SELECT MAX(id) FROM evolution_history WHERE token_id = $2)`,
        [txHash, tokenId]
      );

      logger.info(`✅ Evolution confirmed on-chain: ${txHash}`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to confirm evolution:', error);
      return reply.status(500).send({ error: 'Failed to confirm' });
    }
  });
}
