import type { FastifyReply } from 'fastify';
import { logger } from './logger.js';

export type ErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal_error';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const createError = (
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: unknown
) => new AppError(code, message, statusCode, details);

export const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.code, message: error.message });
  }

  logger.error({ err: error }, 'unhandled_error');
  return reply.status(500).send({ error: 'internal_error', message: 'unexpected_error' });
};
