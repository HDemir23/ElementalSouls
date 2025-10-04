// Core type definitions for Elemental Souls backend

export enum ElementType {
  Fire = 0,
  Water = 1,
  Earth = 2,
  Air = 3,
}

export const ELEMENT_NAMES: Record<ElementType, string> = {
  [ElementType.Fire]: 'Fire',
  [ElementType.Water]: 'Water',
  [ElementType.Earth]: 'Earth',
  [ElementType.Air]: 'Air',
};

export const FORM_NAMES: Record<number, string> = {
  0: 'Egg',
  1: 'Hatchling',
  2: 'Juvenile',
  3: 'Adolescent',
  4: 'Young Adult',
  5: 'Mature',
  6: 'Veteran',
  7: 'Elder',
  8: 'Ancient',
  9: 'Mythic',
  10: 'Transcendent',
};

// EIP-712 Types
export interface EvolvePermit {
  owner: `0x${string}`;
  tokenId: bigint;
  fromLevel: number;
  toLevel: number;
  deadline: bigint;
  nonce: bigint;
  newURI: string;
}

export interface Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}

// Database Models
export interface User {
  id: number;
  address: string;
  token_id?: number;
  created_at: Date;
  last_active: Date;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'onchain' | 'quest';
  required_level: number;
  points: number;
  verification_type: 'manual' | 'auto' | 'signature';
  is_active: boolean;
  created_at: Date;
}

export interface TaskCompletion {
  id: number;
  user_address: string;
  task_id: string;
  token_id: number;
  proof?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  completed_at: Date;
  verified_by?: string;
}

export interface EvolutionHistory {
  id: number;
  token_id: number;
  from_level: number;
  to_level: number;
  metadata_uri: string;
  image_uri: string;
  tx_hash?: string;
  evolved_at: Date;
}

export interface PendingSignature {
  id: string;
  user_address: string;
  token_id: number;
  permit_hash: string;
  signature: string;
  deadline: bigint;
  is_used: boolean;
  created_at: Date;
}

// API Request/Response Types
export interface MintRequest {
  to: string;
  element: ElementType;
}

export interface TaskSubmitRequest {
  taskId: string;
  tokenId: number;
  proof?: {
    type: string;
    url?: string;
    data?: any;
  };
}

export interface EvolutionCheckResponse {
  eligible: boolean;
  currentLevel: number;
  nextLevel: number;
  requirements: {
    totalTasksNeeded: number;
    completedTasks: number;
    missingTasks: string[];
  };
}

export interface EvolutionRequestResponse {
  jobId: string;
  status: 'processing' | 'ready' | 'failed';
  estimatedTime?: string;
  message: string;
}

export interface EvolutionStatusResponse {
  status: 'processing' | 'ready' | 'failed';
  progress?: number;
  stage?: 'validation' | 'ai_generation' | 'ipfs_upload' | 'signing' | 'ready';
  permitSignature?: {
    permit: EvolvePermit;
    signature: `0x${string}`;
  };
  preview?: {
    imageUrl: string;
    metadata: NFTMetadata;
  };
  error?: string;
}

// NFT Metadata
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

// AI Generation
export interface AIGenerationConfig {
  element: ElementType;
  level: number;
  tokenId: number;
  seed?: number;
}

export interface AIGenerationResult {
  imageUrl: string;
  ipfsUrl: string;
  metadata: NFTMetadata;
}

/**
 * Image generation job payloads and results used by BullMQ processors.
 */
export interface ImageGenerationJobPayload {
  jobId: string;
  element: ElementType;
  level: number;
  tokenId: number;
  seed?: number;
  userAddress?: string;
  evolutionCount?: number;
  // optional metadata to aid processing or retries
  metadata?: Record<string, any>;
}

export type ImageJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'timed_out';

export interface ImageJobResult {
  imageUrl?: string;
  ipfsUrl?: string;
  metadataUrl?: string;
  error?: string;
  attempts?: number;
  completedAt?: Date;
}

export interface ImageJobRecord {
  id: string;
  payload: ImageGenerationJobPayload;
  status: ImageJobStatus;
  result?: ImageJobResult;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

// Job Queue
export interface EvolutionJob {
  userAddress: string;
  tokenId: number;
  targetLevel: number;
  currentLevel: number;
}

export interface JobResult {
  success: boolean;
  permitSignature?: {
    permit: EvolvePermit;
    signature: `0x${string}`;
  };
  imageUrl?: string;
  metadataUrl?: string;
  error?: string;
}
