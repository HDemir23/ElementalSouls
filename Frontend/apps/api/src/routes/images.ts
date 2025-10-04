import type { FastifyInstance } from 'fastify';
import {
  imageGenerateRequestSchema,
  imageGenerateResponseSchema,
  imageJobStatusSchema
} from '@elementalsouls/shared';
import { prisma } from '../db/prisma.js';
import { handleError, createError } from '../errors.js';
import {
  verifyWalletSignature,
  withIdempotency,
  computeBodyHash
} from '../security.js';
import { enqueueImageJob, getImageJob, assertJobBelongsToWallet } from '../services/jobs.js';

const ensureRawBody = (rawBody: string | Buffer | undefined) =>
  typeof rawBody === 'string'
    ? Buffer.from(rawBody)
    : rawBody ?? Buffer.from('');

export const registerImageRoutes = async (app: FastifyInstance) => {
  app.post(
    '/images/generate',
    {
      config: { rawBody: true }
    },
    async (request, reply) => {
      try {
        const rawBody = ensureRawBody(request.rawBody);
        const wallet = await verifyWalletSignature(request, rawBody);
        const body = imageGenerateRequestSchema.parse(request.body);
        const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
        const requestHash = computeBodyHash(rawBody);

        const { reused, payload } = await withIdempotency(
          prisma,
          idempotencyKey,
          requestHash,
          async () => {
            const jobId = await enqueueImageJob({ wallet, ...body });
            return imageGenerateResponseSchema.parse({ jobId, status: 'queued' });
          }
        );

        return reply.status(reused ? 200 : 202).send(payload);
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );

  app.get(
    '/images/job/:id',
    {
      config: { rawBody: false }
    },
    async (request, reply) => {
      try {
        const { id: jobId } = request.params as { id?: string };
        if (!jobId) {
          throw createError('invalid_request', 'missing_job_id', 400);
        }

        const rawBody = Buffer.from('');
        const wallet = await verifyWalletSignature(request, rawBody);
        await assertJobBelongsToWallet(jobId, wallet);

        const job = await getImageJob(jobId);
        if (!job) {
          throw createError('not_found', 'job_not_found', 404);
        }

        return reply.send(imageJobStatusSchema.parse(job));
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
};
