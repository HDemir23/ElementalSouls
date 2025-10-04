import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.logging.level,
  transport: env.logging.pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
