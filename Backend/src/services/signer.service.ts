import { createWalletClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { EvolvePermit, Domain } from '../types';

// EIP-712 Domain
const DOMAIN: Domain = {
  name: 'ElementalSoulsEvolver',
  version: '1',
  chainId: env.contract.chainId,
  verifyingContract: env.contract.address,
};

// EIP-712 Types
const TYPES = {
  EvolvePermit: [
    { name: 'owner', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'fromLevel', type: 'uint8' },
    { name: 'toLevel', type: 'uint8' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'newURI', type: 'string' },
  ],
} as const;

export class SignerService {
  private account;
  private walletClient;

  constructor() {
    try {
      this.account = privateKeyToAccount(env.signerPrivateKey);

      this.walletClient = createWalletClient({
        account: this.account,
        transport: http(env.contract.rpcUrl),
      });

      logger.info(`✅ Signer service initialized with address: ${this.account.address}`);
    } catch (error) {
      logger.error('❌ Failed to initialize signer service:', error);
      throw error;
    }
  }

  /**
   * Sign an EvolvePermit for NFT evolution
   */
  async signEvolvePermit(permit: EvolvePermit): Promise<`0x${string}`> {
    try {
      const signature = await this.walletClient.signTypedData({
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'EvolvePermit',
        message: {
          owner: permit.owner,
          tokenId: permit.tokenId,
          fromLevel: permit.fromLevel,
          toLevel: permit.toLevel,
          deadline: permit.deadline,
          nonce: permit.nonce,
          newURI: permit.newURI,
        },
      });

      logger.info(`✅ Signed evolution permit for token ${permit.tokenId}`);
      return signature;
    } catch (error) {
      logger.error('❌ Failed to sign evolution permit:', error);
      throw new Error('Failed to sign evolution permit');
    }
  }

  /**
   * Get the signer address
   */
  getAddress(): Address {
    return this.account.address;
  }

  /**
   * Create an evolution permit with deadline
   */
  createPermit(
    owner: `0x${string}`,
    tokenId: bigint,
    fromLevel: number,
    toLevel: number,
    nonce: bigint,
    newURI: string,
    validFor: number = 15 * 60 // 15 minutes default
  ): EvolvePermit {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + validFor);

    return {
      owner,
      tokenId,
      fromLevel,
      toLevel,
      deadline,
      nonce,
      newURI,
    };
  }
}

// Singleton instance
export const signerService = new SignerService();
