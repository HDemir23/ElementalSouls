import type { FastifyInstance } from 'fastify';

export const registerHealthRoutes = async (app: FastifyInstance) => {
  app.get('/healthz', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
};
