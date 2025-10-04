import { createPublicClient, http, type Address } from 'viem';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ELEMENTAL_SOULS_ABI } from '../config/contract-abi';

export class ContractService {
  private publicClient;

  constructor() {
    this.publicClient = createPublicClient({
      transport: http(env.contract.rpcUrl),
    });

    logger.info(`✅ Contract service initialized for ${env.contract.address}`);
  }

  /**
   * Get NFT owner
   */
  async getOwner(tokenId: bigint): Promise<Address> {
    try {
      const owner = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      });
      return owner;
    } catch (error) {
      logger.error(`Failed to get owner for token ${tokenId}:`, error);
      throw new Error('Token does not exist or contract not deployed');
    }
  }

  /**
   * Get Soul data (element, level, uri, mintedAt)
   */
  async getSoul(tokenId: bigint) {
    try {
      const soul = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'getSoul',
        args: [tokenId],
      });
      return {
        element: soul[0],
        level: soul[1],
        uri: soul[2],
        mintedAt: soul[3],
      };
    } catch (error) {
      logger.error(`Failed to get soul for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get NFT level
   */
  async getLevel(tokenId: bigint): Promise<number> {
    const soul = await this.getSoul(tokenId);
    return soul.level;
  }

  /**
   * Get NFT element
   */
  async getElement(tokenId: bigint): Promise<number> {
    const soul = await this.getSoul(tokenId);
    return soul.element;
  }

  /**
   * Get token URI
   */
  async getTokenURI(tokenId: bigint): Promise<string> {
    try {
      const uri = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      });
      return uri;
    } catch (error) {
      logger.error(`Failed to get token URI for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get NFT full data
   */
  async getTokenData(tokenId: bigint) {
    const [owner, soul] = await Promise.all([
      this.getOwner(tokenId),
      this.getSoul(tokenId),
    ]);

    return {
      tokenId,
      owner,
      level: soul.level,
      element: soul.element,
      uri: soul.uri,
      mintedAt: Number(soul.mintedAt),
    };
  }

  /**
   * Get all tokens owned by address
   */
  async getTokensOfOwner(address: Address): Promise<bigint[]> {
    try {
      const tokens = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'tokensOfOwner',
        args: [address],
      });
      return [...tokens]; // Convert readonly array to mutable
    } catch (error) {
      logger.error(`Failed to get tokens for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Check if address owns any NFT
   */
  async getBalance(address: Address): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      return balance;
    } catch (error) {
      logger.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }


  /**
   * Check if user has already minted
   */
  async getUserMintCount(address: Address): Promise<number> {
    try {
      const count = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'userMintCount',
        args: [address],
      });
      return Number(count);
    } catch (error) {
      logger.error(`Failed to get mint count for ${address}:`, error);
      throw error;
    }
  }


  /**
   * Check if contract is paused
   */
  async isPaused(): Promise<boolean> {
    try {
      const paused = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'paused',
      });
      return paused;
    } catch (error) {
      logger.error('Failed to check pause status:', error);
      throw error;
    }
  }

  /**
   * Get total supply
   */
  async getTotalSupply(): Promise<bigint> {
    try {
      const supply = await this.publicClient.readContract({
        address: env.contract.address,
        abi: ELEMENTAL_SOULS_ABI,
        functionName: 'totalSupply',
      });
      return supply;
    } catch (error) {
      logger.error('Failed to get total supply:', error);
      throw error;
    }
  }
}

// Singleton instance
export const contractService = new ContractService();
