process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '4005';
process.env.RPC_URL = process.env.RPC_URL ?? 'https://rpc.test';
process.env.CHAIN_ID = process.env.CHAIN_ID ?? '20143';
process.env.COLLECTION_ADDRESS =
  process.env.COLLECTION_ADDRESS ?? '0x0000000000000000000000000000000000000000';
process.env.GATEWAY_ADDRESS =
  process.env.GATEWAY_ADDRESS ?? '0x0000000000000000000000000000000000000001';
process.env.OPERATOR_PK =
  process.env.OPERATOR_PK ??
  '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.PERMIT_SIGNER_PK =
  process.env.PERMIT_SIGNER_PK ??
  '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
process.env.NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_TOKEN ?? 'test-nft-storage-token';
process.env.AI_PROVIDER = process.env.AI_PROVIDER ?? 'local';
process.env.AI_TIMEOUT_MS = process.env.AI_TIMEOUT_MS ?? '90000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/elementalsouls_test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.ADMIN_HMAC_KEY =
  process.env.ADMIN_HMAC_KEY ?? 'test_admin_hmac_key_test_admin_hmac_key';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
process.env.MAX_IMAGE_MB = process.env.MAX_IMAGE_MB ?? '8';
process.env.COMFY_URL = process.env.COMFY_URL ?? 'http://localhost:8188';
