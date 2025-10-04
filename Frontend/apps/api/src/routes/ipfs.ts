import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { putImageBuffer, putJson } from '../services/ipfs.js';
import { handleError } from '../errors.js';
import { verifyAdminHmac } from '../security.js';

const uploadImageSchema = z.object({
  data: z.string().min(1),
  contentType: z.string().default('image/png')
});

const uploadJsonSchema = z.object({
  payload: z.record(z.any())
});

export const registerIpfsRoutes = async (app: FastifyInstance) => {
  app.post(
    '/ipfs/upload/image',
    { config: { rawBody: true } },
    async (request, reply) => {
      try {
        const rawBody = request.rawBody ?? Buffer.from('');
        verifyAdminHmac(request, rawBody);
        const body = uploadImageSchema.parse(request.body);
        const buffer = Buffer.from(body.data, 'base64');
        const cid = await putImageBuffer(buffer, body.contentType);
        return reply.status(201).send({ cid });
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );

  app.post(
    '/ipfs/upload/json',
    { config: { rawBody: true } },
    async (request, reply) => {
      try {
        const rawBody = request.rawBody ?? Buffer.from('');
        verifyAdminHmac(request, rawBody);
        const body = uploadJsonSchema.parse(request.body);
        const cid = await putJson(body.payload);
        return reply.status(201).send({ cid });
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
};
