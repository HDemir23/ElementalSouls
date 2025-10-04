import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { api } from '@/lib/api';

const wallet = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ jobId: 'job-1', status: 'queued' }), { status: 202 })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('signs payload and attaches headers', async () => {
    const signMessage = vi.fn(async () => '0x' + '1'.repeat(130));

    await api.generateImage(
      { element: 'Fire', mode: 'txt2img', toLevel: 1 },
      { address: wallet, signMessage, idempotencyKey: 'demo-key' }
    );

    expect(signMessage).toHaveBeenCalledTimes(1);
    const [[url, init]] = (fetch as unknown as vi.Mock).mock.calls;
    expect(url.toString()).toContain('images/generate');
    const headers = (init?.headers as Headers) ?? new Headers(init?.headers);
    expect(headers.get('x-wallet')).toBe(wallet);
    expect(headers.get('Idempotency-Key')).toBe('demo-key');
    expect(headers.get('x-sig')).toMatch(/^0x/);
  });
});
