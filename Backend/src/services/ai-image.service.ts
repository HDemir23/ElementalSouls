import Replicate from 'replicate';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type {
  ElementType,
  AIGenerationConfig,
  NFTMetadata,
  ImageGenerationJobPayload,
  ImageJobRecord,
  ImageJobResult,
} from '../types';
import { ELEMENT_NAMES, FORM_NAMES } from '../types';
import { getRedis } from '../config/redis';

const ELEMENT_THEMES = {
  0: 'fire elemental creature, glowing ember core, flame particles, warm red-orange color palette, volcanic atmosphere',
  1: 'water spirit creature, flowing liquid form, water splash effects, cool blue-cyan palette, ocean depths atmosphere',
  2: 'earth guardian creature, stone and crystal texture, nature growth, green-brown earthy tones, mountain landscape',
  3: 'air sylph creature, cloud wisps, wind currents, light gray-white ethereal palette, sky atmosphere',
};

const LEVEL_DESCRIPTORS = {
  0: { size: 'egg', mood: 'dormant', detail: 'simple smooth surface' },
  1: { size: 'tiny', mood: 'cute newborn', detail: 'simple features' },
  2: { size: 'small', mood: 'playful young', detail: 'moderate detail' },
  3: { size: 'medium', mood: 'curious adolescent', detail: 'detailed features' },
  4: { size: 'medium-large', mood: 'confident young adult', detail: 'highly detailed' },
  5: { size: 'large', mood: 'majestic mature', detail: 'highly detailed intricate' },
  6: { size: 'large imposing', mood: 'powerful veteran', detail: 'intricate masterwork' },
  7: { size: 'very large', mood: 'wise elder', detail: 'intricate epic detail' },
  8: { size: 'massive', mood: 'ancient powerful', detail: 'masterpiece quality' },
  9: { size: 'colossal', mood: 'mythical legendary', detail: 'ultra detailed 8k' },
  10: { size: 'titanic', mood: 'transcendent godlike', detail: 'ultra detailed 8k photorealistic' },
};

export class AIImageService {
  private replicate: Replicate;

  constructor() {
    this.replicate = new Replicate({
      auth: env.replicate.apiToken,
    });
    logger.info('✅ AI Image service initialized (Replicate)');
  }

  /**
   * Generate evolution image using Replicate Flux
   */
  async generateEvolutionImage(config: AIGenerationConfig): Promise<string> {
    const { element, level, tokenId, seed } = config;

    try {
      const prompt = this.generatePrompt(element, level);
      const generatedSeed = seed || this.generateSeed(tokenId, level);

      logger.info(`🎨 Generating AI image for token ${tokenId} level ${level}`);

      const output = await this.replicate.run(
        'black-forest-labs/flux-schnell', // Fast & high quality
        {
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'png',
            output_quality: 90,
            seed: generatedSeed,
          },
        }
      );

      // Output is array of URLs
      const imageUrl = Array.isArray(output) ? output[0] : output;

      logger.info(`✅ AI image generated: ${imageUrl}`);
      return imageUrl as string;
    } catch (error) {
      logger.error('❌ Failed to generate AI image:', error);

      // Fallback: Use placeholder image
      const fallbackUrl = this.generateFallbackImage(element, level, tokenId);
      logger.warn(`⚠️ Using fallback image: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }

  /**
   * Process an image generation job payload. This method is intended to be called
   * by a BullMQ worker/processor. It updates job status in Redis and persists results.
   *
   * Returns an ImageJobResult describing outcome.
   */
  async processImageJob(payload: ImageGenerationJobPayload): Promise<ImageJobResult> {
    const jobId = payload.jobId || `imagejob-${payload.tokenId}-${Date.now()}`;
    const key = `image_job:${jobId}`;
    const now = new Date();

    // Initialize record in Redis as processing
    const initialRecord: ImageJobRecord = {
      id: jobId,
      payload,
      status: 'processing',
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now,
    } as any;

    try {
      await getRedis().set(key, JSON.stringify(initialRecord));

      // Call the synchronous generation method (which may call Replicate)
      const imageUrl = await this.generateEvolutionImage({
        element: payload.element,
        level: payload.level,
        tokenId: payload.tokenId,
        seed: payload.seed,
      });

      // Build metadata
      const metadata = this.createMetadata(
        payload.tokenId,
        payload.element as ElementType,
        payload.level,
        imageUrl,
        payload.evolutionCount || 0
      );

      const result: ImageJobResult = {
        imageUrl,
        ipfsUrl: undefined,
        metadataUrl: undefined,
        attempts: 1,
        completedAt: new Date(),
      };

      // Update record
      const completedRecord: ImageJobRecord = {
        ...initialRecord,
        status: 'completed',
        attempts: 1,
        result,
        updatedAt: new Date(),
      } as any;

      await getRedis().set(key, JSON.stringify(completedRecord));

      return result;
    } catch (err: any) {
      logger.error(`[AIImageService] processImageJob error for ${jobId}`, err);

      const failedRecord: ImageJobRecord = {
        ...initialRecord,
        status: 'failed',
        attempts: (initialRecord.attempts || 0) + 1,
        result: {
          error: err?.message || String(err),
          attempts: (initialRecord.attempts || 0) + 1,
        },
        updatedAt: new Date(),
      } as any;

      await getRedis().set(key, JSON.stringify(failedRecord));

      // Provide structured error for worker retries
      return {
        error: err?.message || String(err),
        attempts: failedRecord.attempts,
      };
    }
  }

  /**
   * Helper to fetch job record from Redis
   */
  async getJobRecord(jobId: string): Promise<ImageJobRecord | null> {
    const key = `image_job:${jobId}`;
    try {
      const raw = await getRedis().get(key);
      if (!raw) return null;
      return JSON.parse(raw) as ImageJobRecord;
    } catch (err) {
      logger.error('[AIImageService] failed to read job record', err);
      return null;
    }
  }

  /**
   * Generate fallback placeholder image
   */
  private generateFallbackImage(
    element: ElementType,
    level: number,
    tokenId: number
  ): string {
    const colors = ['FF6B35', '004E89', '2E7D32', '9E9E9E']; // Fire, Water, Earth, Air
    const color = colors[element];
    const elementName = ELEMENT_NAMES[element];
    const formName = FORM_NAMES[level];

    return `https://via.placeholder.com/512x512/${color}/FFFFFF?text=${elementName}+${formName}`;
  }

  /**
   * Generate prompt based on element and level
   */
  private generatePrompt(element: ElementType, level: number): string {
    const descriptor = LEVEL_DESCRIPTORS[level] || LEVEL_DESCRIPTORS[5];
    const theme = ELEMENT_THEMES[element];

    if (level === 0) {
      // Egg form - simple and consistent
      const eggColors = [
        'obsidian black egg with red cracks',
        'crystalline blue translucent egg',
        'mossy green egg with stone texture',
        'cloud white ethereal glowing egg',
      ];
      return `A mystical ${eggColors[element]}, magical aura, centered composition, white background, fantasy digital art, ${descriptor.detail}, high quality`;
    }

    const prompt = `A ${descriptor.size} ${descriptor.mood} creature, ${theme}, fantasy creature design, ${descriptor.detail}, centered composition, clean white background, professional fantasy illustration, vibrant colors, high quality`;

    return prompt;
  }

  /**
   * Generate deterministic seed for consistency
   */
  private generateSeed(tokenId: number, level: number): number {
    // Deterministic but unique per token+level
    return (tokenId * 1000 + level * 100 + Date.now()) % 2147483647;
  }

  /**
   * Create NFT metadata
   */
  createMetadata(
    tokenId: number,
    element: ElementType,
    level: number,
    imageUri: string,
    evolutionCount: number
  ): NFTMetadata {
    const elementName = ELEMENT_NAMES[element];
    const formName = FORM_NAMES[level];

    return {
      name: `${elementName} Soul #${tokenId} - ${formName}`,
      description: this.generateDescription(element, level),
      image: imageUri,
      attributes: [
        { trait_type: 'Element', value: elementName },
        { trait_type: 'Level', value: level },
        { trait_type: 'Form', value: formName },
        { trait_type: 'Evolution Count', value: evolutionCount },
        { trait_type: 'Generation Method', value: level === 0 ? 'Base' : 'AI-Generated' },
        { trait_type: 'Rarity', value: this.calculateRarity(level) },
      ],
      external_url: `https://elementalsouls.xyz/nft/${tokenId}`,
    };
  }

  /**
   * Generate description based on element and level
   */
  private generateDescription(element: ElementType, level: number): string {
    const elementName = ELEMENT_NAMES[element];
    const formName = FORM_NAMES[level];

    const descriptions = {
      0: `A dormant ${elementName.toLowerCase()} soul, waiting to hatch and begin its evolutionary journey.`,
      1: `A newly hatched ${elementName.toLowerCase()} soul, taking its first steps in the world.`,
      2: `A young ${elementName.toLowerCase()} soul, growing stronger with each passing day.`,
      3: `An adolescent ${elementName.toLowerCase()} soul, discovering its elemental powers.`,
      4: `A young adult ${elementName.toLowerCase()} soul, confident in its growing abilities.`,
      5: `A mature ${elementName.toLowerCase()} soul, fully in control of its elemental nature.`,
      6: `A veteran ${elementName.toLowerCase()} soul, battle-tested and powerful.`,
      7: `An elder ${elementName.toLowerCase()} soul, wise and ancient beyond measure.`,
      8: `An ancient ${elementName.toLowerCase()} soul, one of the most powerful beings in existence.`,
      9: `A mythic ${elementName.toLowerCase()} soul, legendary and feared across all realms.`,
      10: `A transcendent ${elementName.toLowerCase()} soul, having achieved the ultimate form.`,
    };

    return descriptions[level] || `A ${formName} ${elementName.toLowerCase()} soul on its evolutionary journey.`;
  }

  /**
   * Calculate rarity based on level
   */
  private calculateRarity(level: number): string {
    if (level <= 2) return 'Common';
    if (level <= 5) return 'Uncommon';
    if (level <= 7) return 'Rare';
    if (level === 8) return 'Epic';
    if (level === 9) return 'Legendary';
    return 'Mythic';
  }
}

// Singleton instance
export const aiImageService = new AIImageService();
