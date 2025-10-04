import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import { privateKeyToAccount } from 'viem/accounts';
import type { PrismaClient } from '@prisma/client';

const idempotencyStore = new Map<string, any>();
const imageJobStore = new Map<string, any>();

vi.mock('../src/services/jobs.js', () => {
  return {
    enqueueImageJob: vi.fn(async () => 'job-123'),
    getImageJob: vi.fn(async () => ({ status: 'queued' })),
    assertJobBelongsToWallet: vi.fn(async () => undefined),
    ensureJobInfrastructure: vi.fn()
  };
});

vi.mock('../src/db/prisma.js', () => {
  const prisma = {
    idempotencyKey: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return idempotencyStore.get(where.key) ?? null;
      }),
      create: vi.fn(async ({ data }: { data: any }) => {
        const record = { ...data, id: data.key };
        idempotencyStore.set(data.key, record);
        return record;
      }),
      update: vi.fn(async ({ where, data }: { where: { id?: string; key?: string }; data: any }) => {
        const key = where.key ?? where.id!;
        const current = idempotencyStore.get(key);
        const updated = { ...current, ...data };
        idempotencyStore.set(key, updated);
        return updated;
      })
    },
    imageJob: {
      create: vi.fn(async ({ data }: { data: any }) => {
        imageJobStore.set(data.jobId, data);
        return data;
      }),
      findUnique: vi.fn(async ({ where }: { where: { jobId: string } }) => {
        return imageJobStore.get(where.jobId) ?? null;
      }),
      update: vi.fn(async ({ data, where }: { data: any; where: { jobId: string } }) => {
        const current = imageJobStore.get(where.jobId) ?? {};
        const updated = { ...current, ...data };
        imageJobStore.set(where.jobId, updated);
        return updated;
      })
    },
    metadataDraft: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => ({}))
    },
    tokenSnapshot: {
      findMany: vi.fn(async () => []),
      upsert: vi.fn(async () => ({}))
    }
  } satisfies Partial<PrismaClient> as PrismaClient;
  return { prisma };
});

import { buildServer } from '../src/index.js';

const wallet = privateKeyToAccount(
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
);

const signBody = async (body: string) => {
  const hash = crypto.createHash('sha256').update(body).digest('hex');
  return wallet.signMessage({ message: { raw: `0x${hash}` } });
};

let server: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  server = await buildServer();
});

afterAll(async () => {
  await server.close();
});

describe('POST /images/generate', () => {
  it('returns 401 when auth headers missing', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/images/generate',
      payload: {
        element: 'Fire',
        mode: 'txt2img',
        toLevel: 1
      }
    });

    expect(response.statusCode).toBe(401);
  });

  it('enqueues job when payload valid', async () => {
    const payload = {
      element: 'Water',
      mode: 'txt2img',
      toLevel: 2
    };
    const body = JSON.stringify(payload);
    const signature = await signBody(body);

    const response = await server.inject({
      method: 'POST',
      url: '/images/generate',
      payload,
      headers: {
        'x-wallet': wallet.address,
        'x-sig': signature
      }
    });

    expect(response.statusCode).toBe(202);
    const json = response.json();
    expect(json).toEqual({ jobId: 'job-123', status: 'queued' });
  });
});
