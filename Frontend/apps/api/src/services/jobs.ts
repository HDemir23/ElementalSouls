import { Queue, Worker, QueueEvents, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { env } from '../env.js';
import { logger } from '../logger.js';
import { prisma } from '../db/prisma.js';
import { generateImage, type ImageJobPayload } from './ai/index.js';
import { putImageBuffer } from './ipfs.js';
import { createError } from '../errors.js';

export const IMAGE_QUEUE_NAME = 'image:generate';
let redisConnection: IORedis | null = null;
let imageQueue: Queue<ImageJobPayload> | null = null;
let imageWorker: Worker<ImageJobPayload> | null = null;
let queueEvents: QueueEvents | null = null;

const getConnection = () => {
  if (!redisConnection) {
    redisConnection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null
    });
  }
  return redisConnection;
};

const getQueue = () => {
  if (!imageQueue) {
    imageQueue = new Queue<ImageJobPayload>(IMAGE_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 2
      }
    });
  }
  return imageQueue;
};

const ensureQueueEvents = () => {
  if (queueEvents) return queueEvents;
  queueEvents = new QueueEvents(IMAGE_QUEUE_NAME, { connection: getConnection() });
  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'image_job_failed');
  });
  queueEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'image_job_completed');
  });
  return queueEvents;
};

export const initImageWorker = () => {
  if (imageWorker) return imageWorker;
  if (env.NODE_ENV === 'test') {
    return null;
  }
  ensureQueueEvents();

  imageWorker = new Worker<ImageJobPayload>(
    IMAGE_QUEUE_NAME,
    async (job: Job<ImageJobPayload>) => {
      await prisma.imageJob.update({
        where: { jobId: job.id },
        data: { status: 'PROCESSING' }
      });

      try {
        const { buffer, mimeType, prompt } = await generateImage(job.data);
        const imageCid = await putImageBuffer(buffer, mimeType);

        await prisma.imageJob.update({
          where: { jobId: job.id },
          data: {
            status: 'COMPLETED',
            imageCid,
            resultJson: { prompt }
          }
        });

        return { imageCid };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        await prisma.imageJob.update({
          where: { jobId: job.id },
          data: {
            status: 'FAILED',
            error: message
          }
        });
        throw error;
      }
    },
    { connection: getConnection() }
  );

  return imageWorker;
};

export const enqueueImageJob = async (payload: Omit<ImageJobPayload, 'jobId'>) => {
  const jobId = randomUUID();
  await prisma.imageJob.create({
    data: {
      jobId,
      wallet: payload.wallet,
      element: payload.element,
      mode: payload.mode,
      toLevel: payload.toLevel,
      status: 'QUEUED',
      prompt: payload.prompt
    }
  });

  if (env.NODE_ENV === 'test') {
    return jobId;
  }

  await getQueue().add('generate', { ...payload, jobId });
  return jobId;
};

export const getImageJob = async (jobId: string) => {
  const prismaJob = await prisma.imageJob.findUnique({ where: { jobId } });
  if (!prismaJob) {
    return null;
  }

  return {
    status: prismaJob.status.toLowerCase(),
    imageCid: prismaJob.imageCid ?? undefined,
    error: prismaJob.error ?? undefined,
    prompt: prismaJob.resultJson && (prismaJob.resultJson as { prompt?: string }).prompt
  };
};

export const ensureJobInfrastructure = () => {
  if (env.NODE_ENV === 'test') {
    return;
  }
  initImageWorker();
  ensureQueueEvents();
};

export const assertJobBelongsToWallet = async (jobId: string, wallet: `0x${string}`) => {
  const job = await prisma.imageJob.findUnique({ where: { jobId } });
  if (!job || job.wallet.toLowerCase() !== wallet.toLowerCase()) {
    throw createError('not_found', 'job_not_found', 404);
  }
};
