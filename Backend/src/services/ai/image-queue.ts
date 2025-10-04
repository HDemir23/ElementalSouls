import { Queue, JobsOptions } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { getRedis } from '../../config/redis';
import type { ImageGenerationJobPayload, ImageJobRecord } from '../../types';

// Build connection config (mirrors src/services/jobs.ts)
const connection =
  env.redis.url && env.redis.url.length > 0
    ? env.redis.url
    : {
        host: env.redis.host,
        port: env.redis.port,
        username: env.redis.username || undefined,
        password: env.redis.password || undefined,
      } as any;

const QUEUE_NAME = 'ai-image';
const queue = new Queue(QUEUE_NAME, { connection });

/**
 * Enqueue a new image generation job.
 * Creates an initial job record in Redis and pushes the job to BullMQ.
 */
export async function enqueueImageJob(payload: Omit<ImageGenerationJobPayload, 'jobId'>, opts?: JobsOptions) {
  const jobId = payload && (payload as any).jobId ? (payload as any).jobId : uuidv4();
  const fullPayload: ImageGenerationJobPayload = {
    ...(payload as any),
    jobId,
  };

  const record: ImageJobRecord = {
    id: jobId,
    payload: fullPayload,
    status: 'queued',
    attempts: 0,
    maxAttempts: (opts && (opts.attempts as number)) || 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  await getRedis().set(`image_job:${jobId}`, JSON.stringify(record));

  const job = await queue.add(
    'generate-image',
    fullPayload,
    {
      attempts: record.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: 1000 * 5,
      },
      ...opts,
    }
  );

  return job;
}

/**
 * Read image job record from Redis
 */
export async function getImageJobRecord(jobId: string): Promise<ImageJobRecord | null> {
  const raw = await getRedis().get(`image_job:${jobId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImageJobRecord;
  } catch (err) {
    return null;
  }
}

/**
 * Update a stored image job record
 */
export async function setImageJobRecord(record: ImageJobRecord) {
  record.updatedAt = new Date();
  await getRedis().set(`image_job:${record.id}`, JSON.stringify(record));
}

export { queue as imageQueue, connection as imageQueueConnection };

// helper for enqueuing evolution images with typed params
export async function enqueueEvolutionImage(params: {
  element: number;
  level: number;
  tokenId: number;
  seed?: number;
  userAddress?: string;
  evolutionCount?: number;
}, opts?: JobsOptions) {
  return enqueueImageJob({
    element: params.element as any,
    level: params.level,
    tokenId: params.tokenId,
    seed: params.seed,
    userAddress: params.userAddress,
    evolutionCount: params.evolutionCount,
  }, opts);
}

export default {
  enqueueImageJob,
  getImageJobRecord,
  setImageJobRecord,
  enqueueEvolutionImage,
  imageQueue: queue,
};
