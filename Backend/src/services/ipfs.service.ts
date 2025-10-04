import { env } from '../config/env';
import { logger } from '../config/logger';
import type { NFTMetadata } from '../types';
import axios from 'axios';

export class IPFSService {
  private projectId: string;
  private projectSecret: string | undefined;
  private baseUrl = 'https://ipfs.infura.io:5001/api/v0';
  private auth: string;

  constructor() {
    this.projectId = env.infuraIpfs.projectId;
    this.projectSecret = env.infuraIpfs.projectSecret;

    // Create Basic Auth header
    const credentials = this.projectSecret
      ? `${this.projectId}:${this.projectSecret}`
      : this.projectId;
    this.auth = `Basic ${Buffer.from(credentials).toString('base64')}`;

    logger.info('✅ IPFS service initialized (Infura IPFS)');
  }

  /**
   * Upload image from URL to IPFS using Infura IPFS API
   */
  async uploadImageFromURL(imageUrl: string, fileName: string): Promise<string> {
    try {
      logger.info(`📤 Uploading image to IPFS: ${fileName}`);

      // Fetch image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      logger.info(`📦 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

      // Create form data
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', imageBuffer, { filename: fileName });

      // Upload to Infura IPFS using /add endpoint
      const uploadResponse = await axios.post(`${this.baseUrl}/add`, formData, {
        headers: {
          'Authorization': this.auth,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const cid = uploadResponse.data.Hash;
      const ipfsUrl = `ipfs://${cid}`;

      logger.info(`✅ Image uploaded to IPFS: ${ipfsUrl}`);
      return ipfsUrl;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('❌ Infura IPFS API error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        logger.error('❌ Failed to upload image to IPFS:', error);
      }
      throw new Error('IPFS image upload failed');
    }
  }

  /**
   * Upload metadata JSON to IPFS using Infura IPFS API
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    try {
      logger.info(`📤 Uploading metadata to IPFS for: ${metadata.name}`);

      const metadataJson = JSON.stringify(metadata);
      const metadataBuffer = Buffer.from(metadataJson);

      // Create form data
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', metadataBuffer, { filename: 'metadata.json' });

      // Upload to Infura IPFS using /add endpoint
      const uploadResponse = await axios.post(`${this.baseUrl}/add`, formData, {
        headers: {
          'Authorization': this.auth,
          ...formData.getHeaders(),
        },
      });

      const cid = uploadResponse.data.Hash;
      const ipfsUrl = `ipfs://${cid}`;

      logger.info(`✅ Metadata uploaded to IPFS: ${ipfsUrl}`);
      return ipfsUrl;
    } catch (error) {
      logger.error('❌ Failed to upload metadata to IPFS:', error);
      throw new Error('IPFS metadata upload failed');
    }
  }

  /**
   * Upload complete NFT (image + metadata) to IPFS
   * Returns metadata URI that includes the image
   */
  async uploadCompleteNFT(
    imageUrl: string,
    metadata: NFTMetadata,
    tokenId: number,
    level: number
  ): Promise<{ imageUri: string; metadataUri: string }> {
    try {
      // Upload image first
      const imageUri = await this.uploadImageFromURL(imageUrl, `soul_${tokenId}_lvl${level}.png`);

      // Update metadata with IPFS image URL
      const updatedMetadata = {
        ...metadata,
        image: imageUri,
      };

      // Upload metadata
      const metadataUri = await this.uploadMetadata(updatedMetadata);

      return {
        imageUri,
        metadataUri,
      };
    } catch (error) {
      logger.error('❌ Failed to upload complete NFT to IPFS:', error);
      throw error;
    }
  }

  /**
   * Convert IPFS URI to HTTP gateway URL (for preview)
   */
  toGatewayURL(ipfsUri: string): string {
    if (!ipfsUri.startsWith('ipfs://')) {
      return ipfsUri;
    }

    const cid = ipfsUri.replace('ipfs://', '');
    // Use Infura's dedicated gateway
    return `https://${this.projectId}.ipfs.infura-ipfs.io/ipfs/${cid}`;
  }

  /**
   * Fetch metadata from IPFS
   */
  async fetchMetadata(ipfsUri: string): Promise<NFTMetadata> {
    try {
      const url = this.toGatewayURL(ipfsUri);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();
      return metadata;
    } catch (error) {
      logger.error('❌ Failed to fetch metadata from IPFS:', error);
      throw error;
    }
  }
}

// Singleton instance
export const ipfsService = new IPFSService();
