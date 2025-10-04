import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useImageJob } from '@/hooks/useImageJob.js';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api.js')>('@/lib/api');
  return {
    ...actual,
    api: {
      ...actual.api,
      getImageJob: vi.fn(async () => ({ status: 'completed' as const, imageCid: 'ipfs://demo' }))
    }
  } satisfies typeof import('@/lib/api.js');
});

const { api } = await import('@/lib/api.js');

const HookProbe = () => {
  const query = useImageJob('job-1', {
    address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    signMessage: async () => '0x' + '1'.repeat(130)
  });
  return <div data-testid="hook-status" data-status={query.data?.status ?? 'pending'} />;
};

describe('useImageJob hook', () => {
  it('fetches job status until completion', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { getByTestId } = render(
      <QueryClientProvider client={client}>
        <HookProbe />
      </QueryClientProvider>
    );

    const mockedGet = api.getImageJob as unknown as ReturnType<typeof vi.fn>;
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('job-1', expect.any(Object)));
    await waitFor(() => {
      const status = getByTestId('hook-status').getAttribute('data-status');
      expect(status).toBe('completed');
    });
  });
});
