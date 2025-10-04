import { z } from 'zod';

export const elementEnum = z.enum(['Fire', 'Water', 'Earth', 'Air']);
export const imageModeEnum = z.enum(['txt2img', 'img2img']);

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/u, 'invalid_address')
  .transform((address) => address as `0x${string}`);

export const hexStringSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]*$/u, 'invalid_hex');

export const cidSchema = z
  .string()
  .startsWith('ipfs://', 'invalid_cid');

export const bigintStringSchema = z
  .union([
    z.bigint(),
    z
      .string()
      .regex(/^\d+$/u, 'invalid_numeric_string')
      .transform((value) => BigInt(value))
  ])
  .transform((value) => (typeof value === 'bigint' ? value : BigInt(value)));

export const metadataAttributeSchema = z.object({
  trait_type: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()])
});

export const baseMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image: cidSchema,
  animation_url: cidSchema.optional(),
  attributes: z.array(metadataAttributeSchema).default([])
});

export const imageGenerateRequestSchema = z
  .object({
    element: elementEnum,
    mode: imageModeEnum,
    toLevel: z.number().int().min(1).max(10),
    baseCid: cidSchema.optional(),
    prompt: z.string().min(1).max(512).optional(),
    strength: z.number().min(0).max(1).optional(),
    seed: z.number().int().nonnegative().optional()
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'img2img' && !data.baseCid) {
      ctx.addIssue({
        path: ['baseCid'],
        code: z.ZodIssueCode.custom,
        message: 'baseCid_required'
      });
    }
  });

export const imageGenerateResponseSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  imageCid: cidSchema.optional()
});

export const imageJobStatusSchema = z.object({
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  imageCid: cidSchema.optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional()
});

export const mintPrepareRequestSchema = z.object({
  wallet: walletAddressSchema,
  element: elementEnum,
  level: z.number().int().min(0).max(10),
  imageCid: cidSchema,
  attributes: z.array(metadataAttributeSchema).optional()
});

export const mintPrepareResponseSchema = z.object({
  uri: z.string().min(1)
});

export const mintExecRequestSchema = z.object({
  wallet: walletAddressSchema,
  level: z.number().int().min(0).max(10),
  uri: z.string().min(1)
});

export const mintExecResponseSchema = z.object({
  tokenId: bigintStringSchema,
  txHash: hexStringSchema
});

export const evolvePrepareRequestSchema = z.object({
  tokenId: bigintStringSchema,
  toLevel: z.number().int().min(1).max(10),
  imageCid: cidSchema,
  attributes: z.array(metadataAttributeSchema).optional()
});

export const evolvePrepareResponseSchema = z.object({
  tokenId: bigintStringSchema,
  newUri: z.string().min(1),
  fromLevel: z.number().int().min(0),
  toLevel: z.number().int().min(1)
});

export const permitLevelUpRequestSchema = z.object({
  tokenId: bigintStringSchema,
  fromLevel: z.number().int().min(0),
  toLevel: z.number().int().min(1),
  newUri: z.string().min(1),
  ttlSec: z.number().int().positive().max(3600)
});

export const permitLevelUpResponseSchema = z.object({
  permit: z.object({
    owner: walletAddressSchema,
    tokenId: bigintStringSchema,
    fromLevel: z.number().int(),
    toLevel: z.number().int(),
    deadline: bigintStringSchema,
    nonce: bigintStringSchema,
    newUri: z.string().min(1)
  }),
  signature: hexStringSchema,
  bytesForData: hexStringSchema
});

export const gatewayNonceResponseSchema = z.object({
  tokenId: bigintStringSchema,
  nonce: bigintStringSchema
});

export const tokenStateSchema = z.object({
  tokenId: bigintStringSchema,
  owner: walletAddressSchema,
  level: z.number().int().nonnegative(),
  uri: z.string().min(1),
  imageCid: cidSchema.optional(),
  attributes: z.array(metadataAttributeSchema).optional()
});

export const tokensByWalletResponseSchema = z.object({
  wallet: walletAddressSchema,
  tokens: z.array(tokenStateSchema)
});

export type ImageGenerateRequest = z.infer<typeof imageGenerateRequestSchema>;
export type ImageGenerateResponse = z.infer<typeof imageGenerateResponseSchema>;
export type ImageJobStatusResponse = z.infer<typeof imageJobStatusSchema>;
export type MintPrepareRequest = z.infer<typeof mintPrepareRequestSchema>;
export type MintPrepareResponse = z.infer<typeof mintPrepareResponseSchema>;
export type MintExecRequest = z.infer<typeof mintExecRequestSchema>;
export type MintExecResponse = z.infer<typeof mintExecResponseSchema>;
export type EvolvePrepareRequest = z.infer<typeof evolvePrepareRequestSchema>;
export type EvolvePrepareResponse = z.infer<typeof evolvePrepareResponseSchema>;
export type PermitLevelUpRequest = z.infer<typeof permitLevelUpRequestSchema>;
export type PermitLevelUpResponse = z.infer<typeof permitLevelUpResponseSchema>;
export type TokensByWalletResponse = z.infer<typeof tokensByWalletResponseSchema>;
export type Element = z.infer<typeof elementEnum>;
export type ImageMode = z.infer<typeof imageModeEnum>;
export type MetadataAttribute = z.infer<typeof metadataAttributeSchema>;
