'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import type { ImageMode, ImageGenerateResponse } from '@elementalsouls/shared';
import type { Element } from '@elementalsouls/shared';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { useImageJob } from '@/hooks/useImageJob.js';
import { pushToast } from '@/components/TxToast.js';
import { api } from '@/lib/api.js';
import type { SignedRequestContext } from '@/lib/api.js';

interface Props {
  element: Element;
  toLevel: number;
  onComplete: (result: { jobId: string; status: ImageGenerateResponse['status']; imageCid?: string }) => void;
}

const modes: ImageMode[] = ['txt2img', 'img2img'];

export const ImageGenerateForm = ({ element, toLevel, onComplete }: Props) => {
  const { address } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [mode, setMode] = useState<ImageMode>('txt2img');
  const [prompt, setPrompt] = useState('');
  const [baseCid, setBaseCid] = useState('');
  const [strength, setStrength] = useState('0.65');
  const [seed, setSeed] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const baseSignedContext: SignedRequestContext | null = useMemo(() => {
    if (!address) return null;
    return {
      address,
      signMessage: ({ message }) => signMessageAsync({ message })
    };
  }, [address, signMessageAsync]);

  const jobQuery = useImageJob(jobId, baseSignedContext ?? undefined);

  useEffect(() => {
    if (!jobQuery.data) return;
    if (jobQuery.data.status === 'completed') {
      onComplete({ jobId: jobId!, status: jobQuery.data.status, imageCid: jobQuery.data.imageCid });
      pushToast({ title: 'Image ready', description: 'Metadata can now be prepared.' });
    }
    if (jobQuery.data.status === 'failed') {
      setError(jobQuery.data.error ?? 'Generation failed');
      pushToast({ title: 'Generation failed', description: jobQuery.data.error ?? 'Retry with new parameters.' });
    }
  }, [jobQuery.data, jobId, onComplete]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!baseSignedContext) {
      setError('Connect your wallet first.');
      return;
    }
    if (mode === 'img2img' && !baseCid) {
      setError('Provide a base IPFS CID for img2img mode.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.generateImage(
        {
          element,
          mode,
          toLevel,
          prompt: prompt || undefined,
          baseCid: baseCid || undefined,
          strength: mode === 'img2img' ? Number(strength) : undefined,
          seed: seed ? Number(seed) : undefined
        },
        { ...baseSignedContext, idempotencyKey: crypto.randomUUID() }
      );
      setJobId(response.jobId);
      onComplete({ jobId: response.jobId, status: response.status });
      pushToast({
        title: 'Job queued',
        description: `Tracking job ${response.jobId.slice(0, 8)}…`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enqueue job');
      pushToast({ title: 'Generation failed', description: 'Backend rejected the request.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI image generation</CardTitle>
        <CardDescription>
          Craft a new visual for your elemental soul. Jobs run on the backend and stream results to IPFS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mode">Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                {modes.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={mode === value ? 'default' : 'outline'}
                    onClick={() => setMode(value)}
                  >
                    {value === 'txt2img' ? 'Text to Image' : 'Image to Image'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="seed">Seed (optional)</Label>
              <Input
                id="seed"
                type="number"
                inputMode="numeric"
                placeholder="Random"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt">Prompt modifiers</Label>
            <Textarea
              id="prompt"
              placeholder="Add descriptors, lighting, or moods"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>

          {mode === 'img2img' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="baseCid">Base image CID</Label>
                <Input
                  id="baseCid"
                  placeholder="ipfs://..."
                  value={baseCid}
                  onChange={(event) => setBaseCid(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="strength">Blend strength</Label>
                <Input
                  id="strength"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={strength}
                  onChange={(event) => setStrength(event.target.value)}
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting || isSigning || jobQuery.isLoading}>
            {isSubmitting ? 'Submitting...' : 'Generate image'}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {jobId && (
            <div className="rounded-md border border-dashed border-primary bg-primary/10 p-4 text-sm">
              <p className="font-semibold text-primary">Job #{jobId.slice(0, 8)}</p>
              <p>Status: {jobQuery.data?.status ?? 'queued'}</p>
              {jobQuery.data?.imageCid && (
                <p>
                  CID: <code>{jobQuery.data.imageCid}</code>
                </p>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
