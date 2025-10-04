import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { env } from './config/env';
import { logger } from './config/logger';
import { authRoutes } from './routes/auth.routes';
import { tasksRoutes } from './routes/tasks.routes';
import { evolutionRoutes } from './routes/evolution.routes';
import { nftRoutes } from './routes/nft.routes';
import { mintRoutes } from './routes/mint.routes';
import { testRoutes } from './routes/test.routes';

const fastify = Fastify({
  logger: logger,
  trustProxy: true,
});

async function start() {
  try {
    // Register plugins
    await fastify.register(helmet, {
      contentSecurityPolicy: env.isProd ? undefined : false,
    });

    await fastify.register(cors, {
      origin: env.corsOrigin,
      credentials: true,
    });

    await fastify.register(rateLimit, {
      max: env.rateLimit.max,
      timeWindow: env.rateLimit.timeWindow,
    });

    await fastify.register(jwt, {
      secret: env.jwtSecret,
    });

    // Swagger documentation
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Elemental Souls API',
          description: 'Backend API for Elemental Souls NFT Evolution Platform',
          version: '1.0.0',
        },
        servers: [
          {
            url: env.isProd ? 'https://api.elementalsouls.xyz' : `http://localhost:${env.port}`,
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    });

    await fastify.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });

    // Health check
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // Register routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(tasksRoutes, { prefix: '/tasks' });
    await fastify.register(evolutionRoutes, { prefix: '/evolution' });
    await fastify.register(nftRoutes, { prefix: '/nft' });
    await fastify.register(mintRoutes, { prefix: '/mint' });
    await fastify.register(testRoutes, { prefix: '/test' });

    // 404 handler
    fastify.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: 'Not Found',
        message: `Route ${request.method} ${request.url} not found`,
      });
    });

    // Error handler
    fastify.setErrorHandler((error, request, reply) => {
      logger.error('Error:', error);

      if (error.validation) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.message,
          details: error.validation,
        });
      }

      reply.status(500).send({
        error: 'Internal Server Error',
        message: env.isDev ? error.message : 'Something went wrong',
      });
    });

    // Start server
    await fastify.listen({
      port: env.port,
      host: env.host,
    });

    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║  🔥 Elemental Souls Backend API                           ║
║  ✅ Server running on http://${env.host}:${env.port}         ║
║  📚 Swagger docs: http://${env.host}:${env.port}/docs      ║
║  🌍 Environment: ${env.nodeEnv}                              ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
