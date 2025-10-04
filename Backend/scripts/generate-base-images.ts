#!/usr/bin/env tsx

/**
 * Script to generate Level 1 and Level 2 images for all elements
 * Usage: npx tsx scripts/generate-base-images.ts
 */

import { aiImageService } from '../src/services/ai-image.service';
import { ipfsService } from '../src/services/ipfs.service';
import { logger } from '../src/config/logger';
import type { ElementType } from '../src/types';
import { ELEMENT_NAMES } from '../src/types';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, '..', 'generated-images');

interface ImageResult {
  element: string;
  level: number;
  imageUrl: string;
  ipfsUrl?: string;
  metadataUrl?: string;
  error?: string;
}

async function generateImage(
  element: ElementType,
  level: number,
  tokenId: number
): Promise<ImageResult> {
  const elementName = ELEMENT_NAMES[element];

  logger.info(`\n🎨 Generating ${elementName} Level ${level} image...`);

  try {
    // Generate AI image
    const imageUrl = await aiImageService.generateEvolutionImage({
      element,
      level,
      tokenId,
      seed: tokenId * 1000 + level * 100,
    });

    logger.info(`✅ Image generated: ${imageUrl}`);

    // Upload to IPFS
    logger.info('📤 Uploading to IPFS...');
    const metadata = aiImageService.createMetadata(tokenId, element, level, imageUrl, level);
    const { imageUri, metadataUri } = await ipfsService.uploadMetadata(imageUrl, metadata);

    logger.info(`✅ IPFS Upload complete:`);
    logger.info(`   Image: ${imageUri}`);
    logger.info(`   Metadata: ${metadataUri}`);

    return {
      element: elementName,
      level,
      imageUrl,
      ipfsUrl: imageUri,
      metadataUrl: metadataUri,
    };
  } catch (error: any) {
    logger.error(`❌ Failed to generate ${elementName} Level ${level}:`, error.message);
    return {
      element: elementName,
      level,
      imageUrl: '',
      error: error.message,
    };
  }
}

async function main() {
  logger.info('🚀 Starting base image generation for all elements...');
  logger.info('Elements: Fire (0), Water (1), Earth (2), Air (3)');
  logger.info('Levels: 1 (Hatchling), 2 (Juvenile)\n');

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const results: ImageResult[] = [];

  // Generate for all elements and levels
  const elements: ElementType[] = [0, 1, 2, 3]; // Fire, Water, Earth, Air
  const levels = [1, 2];

  let tokenId = 1000; // Starting token ID for generation

  for (const element of elements) {
    for (const level of levels) {
      const result = await generateImage(element, level, tokenId);
      results.push(result);
      tokenId++;

      // Wait a bit between generations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save results to JSON file
  const outputPath = path.join(OUTPUT_DIR, 'generation-results.json');
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));

  // Print summary
  logger.info('\n' + '='.repeat(80));
  logger.info('📊 GENERATION SUMMARY');
  logger.info('='.repeat(80));

  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);

  logger.info(`✅ Successful: ${successful.length}/${results.length}`);
  logger.info(`❌ Failed: ${failed.length}/${results.length}`);

  logger.info('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.error ? '❌' : '✅';
    logger.info(`${status} ${result.element} Level ${result.level}`);
    if (result.ipfsUrl) {
      logger.info(`   IPFS: ${result.ipfsUrl}`);
    }
    if (result.error) {
      logger.info(`   Error: ${result.error}`);
    }
  });

  logger.info(`\n💾 Results saved to: ${outputPath}`);
  logger.info('\n✨ Generation complete!');
}

// Run the script
main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
