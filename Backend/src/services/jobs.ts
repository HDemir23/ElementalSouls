import { Queue, Worker, QueueScheduler, JobsOptions } from 'bullmq';
import { env } from '../config/env';
import Redis from 'ioredis';
// Ensure image-job processor is loaded so its Worker is started when initQueues is called
import './ai/image-job.processor';
 
// Build connection config for BullMQ / ioredis
const connection =
  env.redis.url && env.redis.url.length > 0
    ? // If REDIS_URL is provided prefer it
      env.redis.url
    : {
        host: env.redis.host,
        port: env.redis.port,
        username: env.redis.username || undefined,
        password: env.redis.password || undefined,
      } as any;
 
/**
 * Simple queue manager for the application.
 *
 * Exports:
 * - createQueue(name) -> Queue
 * - addJob(name, jobName, payload, opts) -> Promise<Job | void>
 * - initQueues() -> initialize scheduler + example worker (safe no-op if in production spawn different processes)
 *
 * Note: For production you may want to run workers in separate processes. This file provides
 * a lightweight in-process worker suitable for development and basic processing.
 */
 
// Keep a map of queues for reuse
const queues = new Map<string, Queue>();
 
export function createQueue(name: string) {
  if (queues.has(name)) return queues.get(name)!;
 
  const queue = new Queue(name, { connection });
  queues.set(name, queue);
  return queue;
}
 
/**
 * Add a job to a named queue.
 */
export async function addJob(name: string, jobName: string, payload: any, opts?: JobsOptions) {
  const queue = createQueue(name);
  return queue.add(jobName, payload, opts);
}
 
/**
 * Initialize queue schedulers and a lightweight worker for development.
 * Call this from app startup if you want an in-process worker for quick testing.
 */
export function initQueues() {
  // Create a scheduler for each queue we know about when jobs are added. For demo create a scheduler for "default"
  const scheduler = new QueueScheduler('default', { connection });
  scheduler.on('failed', (err) => {
    console.error('[queue-scheduler] failed', err);
  });
 
  // Also create scheduler for AI image queue so delayed/retry jobs behave correctly
  const aiImageScheduler = new QueueScheduler('ai-image', { connection });
  aiImageScheduler.on('failed', (err) => {
    console.error('[ai-image-scheduler] failed', err);
  });
 
  // Lightweight worker that logs job processing for the default queue.
  // In production prefer separate worker processes.
  const worker = new Worker(
    'default',
    async (job) => {
      console.info(`[jobs] processing job ${job.id} ${job.name}`, job.data);
      // Add real handlers here by job.name
      return { ok: true };
    },
    { connection }
  );
 
  worker.on('completed', (job) => {
    console.info(`[jobs] completed ${job.id} ${job.name}`);
  });
 
  worker.on('failed', (job, err) => {
    console.error(`[jobs] failed ${job?.id} ${job?.name}`, err);
  });
 
  // Note: the AI image worker is started by importing ./ai/image-job.processor above.
  return { scheduler, worker, aiImageScheduler };
}
 
export default {
  createQueue,
  addJob,
  initQueues,
};