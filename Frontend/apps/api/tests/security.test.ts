import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { withIdempotency } from '../src/security.js';

type RecordType = {
  id: string;
  key: string;
  requestHash: string;
  status: 'IN_FLIGHT' | 'COMPLETED' | 'FAILED';
  response?: unknown;
};

const createPrismaStub = () => {
  const store = new Map<string, RecordType>();

  const prisma = {
    idempotencyKey: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return store.get(where.key) ?? null;
      }),
      create: vi.fn(async ({ data }: { data: RecordType }) => {
        const record = { ...data, id: data.id ?? data.key };
        store.set(record.key, record);
        return record;
      }),
      update: vi.fn(async ({
        where,
        data
      }: {
        where: { id?: string; key?: string };
        data: Partial<RecordType>;
      }) => {
        const record = store.get(where.key ?? where.id!);
        if (!record) throw new Error('record not found');
        const updated = { ...record, ...data } as RecordType;
        store.set(updated.key, updated);
        return updated;
      })
    }
  } satisfies Partial<PrismaClient> as PrismaClient;

  return { prisma, store };
};

describe('withIdempotency', () => {
  it('reuses completed responses and skips handler', async () => {
    const { prisma } = createPrismaStub();
    const handler = vi.fn(async () => ({ ok: true }));

    const first = await withIdempotency(prisma, 'key-1', 'hash-a', handler);
    expect(first.reused).toBe(false);
    expect(first.payload).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledTimes(1);

    const second = await withIdempotency(prisma, 'key-1', 'hash-a', handler);
    expect(second.reused).toBe(true);
    expect(second.payload).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
