import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifySiweMessage } from '../middleware/auth';
import { db } from '../db/client';
import { logger } from '../config/logger';

const loginSchema = z.object({
  message: z.string(),
  signature: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Sign in with Ethereum (SIWE)
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const { message, signature } = loginSchema.parse(request.body);

      // Verify SIWE signature
      const address = await verifySiweMessage(message, signature);

      // Upsert user in database
      await db.query(
        `INSERT INTO users (address, last_active)
         VALUES ($1, CURRENT_TIMESTAMP)
         ON CONFLICT (address)
         DO UPDATE SET last_active = CURRENT_TIMESTAMP`,
        [address]
      );

      // Get user data
      const result = await db.query(
        `SELECT id, address, token_id, created_at FROM users WHERE address = $1`,
        [address]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = fastify.jwt.sign(
        { address },
        { expiresIn: '7d' }
      );

      logger.info(`✅ User logged in: ${address}`);

      return {
        token,
        user: {
          address: user.address,
          tokenId: user.token_id,
          createdAt: user.created_at,
        },
      };
    } catch (error) {
      logger.error('Login failed:', error);
      return reply.status(401).send({ error: 'Authentication failed' });
    }
  });

  /**
   * GET /auth/nonce
   * Get nonce for SIWE message
   */
  fastify.get('/nonce', async () => {
    const nonce = Math.random().toString(36).substring(2, 15);
    return { nonce };
  });
}
