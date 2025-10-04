import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './client';
import { logger } from '../config/logger';

async function seedDatabase() {
  try {
    logger.info('🌱 Seeding database with tasks...');

    const seedSQL = readFileSync(join(__dirname, 'seeds', 'tasks.sql'), 'utf-8');

    await db.query(seedSQL);

    // Verify seeding
    const result = await db.query('SELECT COUNT(*) as count FROM tasks');
    const taskCount = result.rows[0].count;

    logger.info(`✅ Database seeded with ${taskCount} tasks`);
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
