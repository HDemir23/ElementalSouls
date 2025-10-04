import { Worker, Job } from 'bullmq';
import { logger } from '../../config/logger';
import {
  imageQueueConnection,
  getImageJobRecord,
  setImageJobRecord,
} from './image-queue';
import { aiImageService } from '../ai-image.service';
import type {
  ImageGenerationJobPayload,
  ImageJobRecord,
  ImageJobResult,
} from '../../types';
import { getRedis } from '../../config/redis';

const QUEUE_NAME = 'ai-image';

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job<ImageGenerationJobPayload>) => {
    const payload = job.data;
    const jobId = payload.jobId || `imagejob-${payload.tokenId}-${Date.now()}`;
    const now = new Date();

    const existing = await getImageJobRecord(jobId);
    const record: ImageJobRecord = existing || {
      id: jobId,
      payload,
      status: 'processing',
      attempts: 0,
      maxAttempts: job.opts.attempts || 3,
      createdAt: now,
      updatedAt: now,
    } as any;

    record.status = 'processing';
    record.attempts = (job.attemptsMade || 0) + 1;
    record.updatedAt = new Date();
    await setImageJobRecord(record);

    logger.info(`[image-worker] started job ${jobId} attempt ${record.attempts}`);

    try {
      const result: ImageJobResult = await aiImageService.processImageJob(payload);

      const completedRecord: ImageJobRecord = {
        ...record,
        status: 'completed',
        result,
        attempts: record.attempts,
        updatedAt: new Date(),
      } as any;

      await setImageJobRecord(completedRecord);
      logger.info(`[image-worker] completed job ${jobId}`);
      return { ok: true };
    } catch (err: any) {
      logger.error(`[image-worker] processing failed for job ${jobId}`, err);
      const existing2 = await getImageJobRecord(jobId);
      const failedRecord: ImageJobRecord = existing2 || {
        id: jobId,
        payload,
        status: 'failed',
        attempts: (job.attemptsMade || 0) + 1,
        maxAttempts: job.opts.attempts || 3,
        createdAt: now,
        updatedAt: new Date(),
      } as any;

      failedRecord.status = 'failed';
      failedRecord.attempts = (job.attemptsMade || 0) + 1;
      failedRecord.result = {
        error: err?.message || String(err),
        attempts: failedRecord.attempts,
      } as any;
      failedRecord.updatedAt = new Date();

      await setImageJobRecord(failedRecord);

      throw err;
    }
  },
  {
    connection: imageQueueConnection as any,
    concurrency: 2,
  }
);

worker.on('completed', async (job) => {
  try {
    const payload = job.data;
    const jobId = payload.jobId;
    const record = await getImageJobRecord(jobId);
    if (record && record.status !== 'completed') {
      record.status = 'completed';
      record.attempts = job.attemptsMade + 1;
      record.updatedAt = new Date();
      await setImageJobRecord(record);
    }
    logger.info(`[image-worker] job completed event ${jobId}`);
  } catch (err) {
    logger.warn('[image-worker] completed handler error', err);
  }
});

worker.on('failed', async (job, err) => {
  try {
    const payload = job?.data as ImageGenerationJobPayload | undefined;
    const jobId = payload?.jobId;
    if (jobId) {
      const record = await getImageJobRecord(jobId);
      if (record) {
        record.status = job.attemptsMade >= (record.maxAttempts || 3) ? 'failed' : 'processing';
        record.attempts = job.attemptsMade;
        record.result = record.result || { error: err?.message || String(err), attempts: job.attemptsMade } as any;
        record.updatedAt = new Date();
        await setImageJobRecord(record);
      }
    }
    logger.error(`[image-worker] job failed ${job?.id} ${jobId}`, err);
  } catch (inner) {
    logger.error('[image-worker] failed handler error', inner);
  }
});

worker.on('error', (err) => {
  logger.error('[image-worker] worker error', err);
});

export default worker;