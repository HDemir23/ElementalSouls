import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import rawBody from 'fastify-raw-body';
import { env } from './env.js';
import { logger } from './logger.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerImageRoutes } from './routes/images.js';
import { registerIpfsRoutes } from './routes/ipfs.js';
import { registerMintRoutes } from './routes/mint.js';
import { registerEvolveRoutes } from './routes/evolve.js';
import { registerPermitRoutes } from './routes/permits.js';
import { registerTokenRoutes } from './routes/tokens.js';
import { ensureJobInfrastructure } from './services/jobs.js';
import { handleError } from './errors.js';

export const buildServer = async () => {
  const app = Fastify({
    logger,
    trustProxy: true
  });

  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true
  });

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true
  });
  await app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    allowList: [],
    keyGenerator(request) {
      const wallet = typeof request.headers['x-wallet'] === 'string' ? request.headers['x-wallet'] : '';
      return `${request.ip}:${wallet.toLowerCase()}`;
    }
  });
  await app.register(sensible);

  await registerHealthRoutes(app);
  await registerImageRoutes(app);
  await registerIpfsRoutes(app);
  await registerMintRoutes(app);
  await registerEvolveRoutes(app);
  await registerPermitRoutes(app);
  await registerTokenRoutes(app);

  app.setErrorHandler((error, _request, reply) => handleError(reply, error));

  ensureJobInfrastructure();
  return app;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const start = async () => {
    const app = await buildServer();
    try {
      await app.listen({ port: env.PORT, host: '0.0.0.0' });
      logger.info({ port: env.PORT }, 'api_started');
    } catch (error) {
      app.log.error(error, 'failed_to_start');
      process.exit(1);
    }
  };

  void start();
}
