import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../config/logger';
 
// Ensure Prisma reads the right DATABASE_URL at runtime
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.database.url;
}
 
export const db = new PrismaClient();
 
// Test connection
db
  .$connect()
  .then(() => {
    logger.info('✅ Prisma connected');
  })
  .catch((err) => {
    logger.error('❌ Prisma connection error:', err);
  });
 
// Graceful shutdown
process.on('SIGINT', async () => {
  await db.$disconnect();
  logger.info('Prisma client disconnected');
  process.exit(0);
});
