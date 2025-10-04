import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db/client';
import { logger } from '../config/logger';

const submitTaskSchema = z.object({
  taskId: z.string(),
  tokenId: z.number(),
  proof: z.object({
    type: z.string(),
    url: z.string().optional(),
    data: z.any().optional(),
  }).optional(),
});

const verifyTaskSchema = z.object({
  completionId: z.number(),
  approved: z.boolean(),
  adminNote: z.string().optional(),
});

export async function tasksRoutes(fastify: FastifyInstance) {
  /**
   * GET /tasks/available
   * Get all available tasks for user's level
   */
  fastify.get('/available', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const level = parseInt((request.query as any).level || '0');
      const userAddress = request.user!.address;

      // Get all tasks available for this level
      const tasksResult = await db.query(
        `SELECT * FROM tasks
         WHERE required_level <= $1 AND is_active = true
         ORDER BY required_level ASC, points ASC`,
        [level]
      );

      // Get completed tasks for this user
      const completedResult = await db.query(
        `SELECT task_id FROM task_completions
         WHERE user_address = $1 AND status = 'approved'`,
        [userAddress]
      );

      const completedTaskIds = new Set(completedResult.rows.map(r => r.task_id));

      // Mark completed tasks
      const tasks = tasksResult.rows.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        category: task.category,
        requiredLevel: task.required_level,
        points: task.points,
        verificationType: task.verification_type,
        isCompleted: completedTaskIds.has(task.id),
      }));

      return { tasks };
    } catch (error) {
      logger.error('Failed to fetch tasks:', error);
      return reply.status(500).send({ error: 'Failed to fetch tasks' });
    }
  });

  /**
   * POST /tasks/submit
   * Submit task completion
   */
  fastify.post('/submit', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { taskId, tokenId, proof } = submitTaskSchema.parse(request.body);
      const userAddress = request.user!.address;

      // Check if task exists
      const taskResult = await db.query(
        `SELECT * FROM tasks WHERE id = $1 AND is_active = true`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      const task = taskResult.rows[0];

      // Check if already completed
      const existingResult = await db.query(
        `SELECT * FROM task_completions
         WHERE user_address = $1 AND task_id = $2 AND token_id = $3`,
        [userAddress, taskId, tokenId]
      );

      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        if (existing.status === 'approved') {
          return reply.status(400).send({ error: 'Task already completed' });
        } else if (existing.status === 'pending') {
          return reply.status(400).send({ error: 'Task already submitted, waiting for verification' });
        }
      }

      // Insert task completion
      const status = task.verification_type === 'auto' ? 'approved' : 'pending';

      await db.query(
        `INSERT INTO task_completions (user_address, task_id, token_id, proof, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_address, task_id, token_id)
         DO UPDATE SET status = $5, proof = $4, completed_at = CURRENT_TIMESTAMP`,
        [userAddress, taskId, tokenId, JSON.stringify(proof || {}), status]
      );

      logger.info(`✅ Task submitted: ${taskId} by ${userAddress}`);

      return {
        status,
        message: status === 'approved'
          ? 'Task automatically verified'
          : 'Task submitted for review',
        estimatedReviewTime: status === 'pending' ? '1-24 hours' : undefined,
      };
    } catch (error) {
      logger.error('Failed to submit task:', error);
      return reply.status(500).send({ error: 'Failed to submit task' });
    }
  });

  /**
   * GET /tasks/progress
   * Get task progress for user
   */
  fastify.get('/progress', {
    preHandler: authenticateUser,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const userAddress = request.user!.address;
      const level = parseInt((request.query as any).level || '0');

      // Get total approved tasks
      const completedResult = await db.query(
        `SELECT COUNT(*) as count FROM task_completions
         WHERE user_address = $1 AND status = 'approved'`,
        [userAddress]
      );

      const completedCount = parseInt(completedResult.rows[0].count);

      // Task requirements per level (from spec)
      const levelRequirements: Record<number, number> = {
        0: 0, 1: 3, 2: 5, 3: 7, 4: 10, 5: 12,
        6: 15, 7: 18, 8: 22, 9: 25, 10: 30,
      };

      const nextLevel = level + 1;
      const tasksNeeded = levelRequirements[nextLevel] || 0;

      return {
        currentLevel: level,
        completedTasks: completedCount,
        nextLevelRequirements: {
          level: nextLevel,
          tasksNeeded,
          tasksRemaining: Math.max(0, tasksNeeded - completedCount),
          eligible: completedCount >= tasksNeeded,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch progress:', error);
      return reply.status(500).send({ error: 'Failed to fetch progress' });
    }
  });

  /**
   * POST /tasks/verify (Admin only)
   * Manually verify a task completion
   */
  fastify.post('/verify', async (request, reply) => {
    try {
      // TODO: Add admin authentication
      const { completionId, approved, adminNote } = verifyTaskSchema.parse(request.body);

      const status = approved ? 'approved' : 'rejected';

      await db.query(
        `UPDATE task_completions
         SET status = $1, verified_by = $2
         WHERE id = $3`,
        [status, 'admin', completionId] // Replace 'admin' with actual admin address
      );

      logger.info(`✅ Task ${completionId} ${status}`);

      return { success: true, status };
    } catch (error) {
      logger.error('Failed to verify task:', error);
      return reply.status(500).send({ error: 'Failed to verify task' });
    }
  });

  /**
   * GET /tasks/pending (Admin only)
   * Get pending task submissions
   */
  fastify.get('/pending', async (request, reply) => {
    try {
      // TODO: Add admin authentication

      const result = await db.query(
        `SELECT tc.*, t.name as task_name, t.category, t.points
         FROM task_completions tc
         JOIN tasks t ON tc.task_id = t.id
         WHERE tc.status = 'pending'
         ORDER BY tc.completed_at DESC
         LIMIT 100`
      );

      return {
        pending: result.rows.map(row => ({
          id: row.id,
          userAddress: row.user_address,
          taskId: row.task_id,
          taskName: row.task_name,
          category: row.category,
          points: row.points,
          tokenId: row.token_id,
          proof: row.proof,
          completedAt: row.completed_at,
        })),
      };
    } catch (error) {
      logger.error('Failed to fetch pending tasks:', error);
      return reply.status(500).send({ error: 'Failed to fetch pending tasks' });
    }
  });
}
