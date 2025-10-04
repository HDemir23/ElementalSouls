import { FastifyRequest, FastifyReply } from 'fastify';
import { SiweMessage } from 'siwe';
import { logger } from '../config/logger';

export type AuthenticatedRequest = FastifyRequest & {
  user?: {
    address: string;
  };
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticateUser(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    // Verify JWT
    const decoded = await request.server.jwt.verify<{ address: string }>(token);

    // Attach user to request
    request.user = {
      address: decoded.address,
    };
  } catch (error) {
    logger.error('Authentication failed:', error);
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

/**
 * Verify SIWE message signature
 */
export async function verifySiweMessage(message: string, signature: string): Promise<string> {
  try {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      throw new Error('Invalid signature');
    }

    return siweMessage.address;
  } catch (error) {
    logger.error('SIWE verification failed:', error);
    throw new Error('Invalid SIWE signature');
  }
}
