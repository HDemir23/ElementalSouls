import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './client';
import { logger } from '../config/logger';

async function runMigrations() {
  try {
    logger.info('🔄 Running database migrations...');

    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

    await db.query(schemaSQL);

    logger.info('✅ Database migrations completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
