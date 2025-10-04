# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Elemental Souls Backend** - Backend API for an NFT Evolution Platform on Monad blockchain. Users mint elemental NFTs, complete tasks, and evolve their NFTs through levels using AI-generated artwork and EIP-712 signed permits.

**Tech Stack**: Fastify 4, TypeScript, PostgreSQL, MongoDB, viem 2.x, Replicate AI, IPFS (NFT.Storage)

---

## Development Commands

```bash
# Development (hot reload)
npm run dev

# Build TypeScript
npm run build

# Production
npm start

# Database
npm run migrate        # Run PostgreSQL migrations
npm run seed          # Seed task data

# Testing
npm test                                           # Run all tests
npm test -- src/services/signer.service.test.ts   # Test specific file

# Code Quality
npm run lint
npm run format

# Docker
docker-compose up -d      # Start all services (PostgreSQL + Redis + API)
docker-compose logs -f api
docker-compose down
```

---

## Architecture Overview

### Core Data Flow

**1. Authentication**: SIWE (Sign-In With Ethereum) → JWT tokens
**2. Minting**: User requests mint → Backend generates base NFT image → Uploads to IPFS → Backend mints NFT (gasless for user)
**3. Tasks**: Users complete tasks → Submit proof → Admin/Auto verification → Points awarded
**4. Evolution**: Check eligibility → Request evolution → AI generates new image → Upload to IPFS → Backend signs EIP-712 permit → Frontend submits to contract → User pays gas

### Directory Structure

```
src/
├── config/           # Environment validation (env.ts), logging, contract ABI
├── db/               # PostgreSQL client, migrations, schema, seeds
├── middleware/       # JWT authentication (auth.ts)
├── routes/           # API route handlers
│   ├── auth.routes.ts       # SIWE login, nonce generation
│   ├── tasks.routes.ts      # Task management, submissions, verification
│   ├── evolution.routes.ts  # Evolution eligibility, request, confirmation
│   ├── nft.routes.ts        # NFT data retrieval, preview evolution
│   ├── mint.routes.ts       # Minting (gasless & user-paid)
│   └── test.routes.ts       # Testing utilities
├── services/         # Business logic
│   ├── signer.service.ts    # EIP-712 signature generation
│   ├── contract.service.ts  # Blockchain reads via viem
│   ├── ai-image.service.ts  # Replicate API integration
│   └── ipfs.service.ts      # IPFS uploads via NFT.Storage
├── types/            # TypeScript definitions (EvolvePermit, NFTMetadata, etc.)
└── server.ts         # Fastify app initialization
```

---

## Critical Integration Points

### EIP-712 Signature Flow

The backend signs evolution permits using EIP-712 typed data. This signature is verified on-chain by the smart contract.

**Contract Typehash**:
```solidity
EvolvePermit(address owner,uint256 tokenId,uint8 fromLevel,uint8 toLevel,uint256 deadline,uint256 nonce,string newURI)
```

**Domain** (must match contract):
- name: `"ElementalSoulsEvolver"`
- version: `"1"`
- chainId: From `MONAD_CHAIN_ID` env var
- verifyingContract: `CONTRACT_ADDRESS` env var

**Implementation**: `src/services/signer.service.ts`
The signer's private key (`SIGNER_PRIVATE_KEY`) must correspond to the `authorizedSigner` address in the deployed smart contract. Verify match via `GET /nft/contract/info` (check `signerMatches: true`).

### Database Schema

**Key Tables**:
- `users`: Wallet addresses, token IDs
- `tasks`: Task definitions (category, points, verification type, required level)
- `task_completions`: User task submissions with status (pending/approved/rejected)
- `evolution_history`: Record of all evolutions (token_id, from_level, to_level, tx_hash)
- `pending_signatures`: Unused evolution signatures with deadlines
- `nft_cache`: Fast NFT data lookups (owner, element, level, nonce)

**Indexes**: Heavily indexed on `user_address`, `token_id`, `status`, `required_level` for performance.

### Task Requirements by Level

Defined in `src/routes/evolution.routes.ts`:
```
Level 0→1:  3 tasks  | Level 5→6:  12 tasks
Level 1→2:  5 tasks  | Level 6→7:  15 tasks
Level 2→3:  7 tasks  | Level 7→8:  18 tasks
Level 3→4: 10 tasks  | Level 8→9:  22 tasks
Level 4→5: 12 tasks  | Level 9→10: 25 tasks
```

Eligibility check counts **approved** tasks at or below current level via `task_completions` table.

---

## Environment Configuration

### Required Environment Variables

**Smart Contract**:
- `CONTRACT_ADDRESS`: Deployed ElementalSouls contract (must be valid 0x address)
- `MONAD_RPC_URL`: Monad blockchain RPC endpoint
- `MONAD_CHAIN_ID`: Chain ID (default: 10143)
- `SIGNER_PRIVATE_KEY`: Backend wallet private key (MUST match contract's authorized signer)

**External Services**:
- `REPLICATE_API_TOKEN`: Replicate API for AI image generation (Flux-Schnell model)
- `NFT_STORAGE_API_KEY`: NFT.Storage for IPFS uploads
- `INFURA_IPFS_PROJECT_ID`: Infura IPFS fallback

**Database**:
- `DATABASE_URL` or `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` (PostgreSQL)
- `MONGODB_URI`: MongoDB for caching and data storage

**Security**:
- `JWT_SECRET`: Min 32 characters for JWT signing
- `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`: Rate limiting config
- `CORS_ORIGIN`: Comma-separated allowed origins

All env vars are validated via Zod schema in `src/config/env.ts`. Missing/invalid vars cause startup failure.

---

## Key API Endpoints

### Authentication
- `GET /auth/nonce` - Get SIWE nonce
- `POST /auth/login` - Login with SIWE signature → JWT token

### Minting
- `POST /mint/request` - Backend mints NFT (gasless for user, backend pays gas)
- `POST /mint/prepare` - Prepare mint data (user pays gas on frontend)
- `GET /mint/check/:address` - Check if address already minted

### NFT Data
- `GET /nft/:tokenId` - Full NFT data (owner, element, level, metadata from IPFS)
- `GET /nft/user/:address` - Get user's NFTs
- `GET /nft/contract/info` - Contract info + signer verification
- `POST /nft/preview-evolution` - Preview next level without committing
- `GET /nft/eip712/domain` - EIP-712 domain for frontend signature verification

### Tasks
- `GET /tasks/available?level=X` - Get available tasks for level
- `POST /tasks/submit` - Submit task completion with proof
- `GET /tasks/progress?level=X` - Get user's task progress
- `GET /tasks/pending` - Get pending verifications (admin)
- `POST /tasks/verify` - Verify task (admin)

### Evolution
- `POST /evolution/check-eligibility` - Check if eligible to evolve
- `POST /evolution/request` - Request evolution (generates AI image, IPFS upload, EIP-712 signature)
- `GET /evolution/history/:tokenId` - Get evolution history
- `POST /evolution/confirm` - Confirm on-chain evolution with tx hash

### Utility
- `GET /health` - Health check (status, uptime)
- `GET /docs` - Swagger UI documentation

---

## Important Implementation Notes

### AI Image Generation (`ai-image.service.ts`)

Uses **Replicate API** with Flux-Schnell model. Generates images based on:
- **Element type** (Fire/Water/Earth/Air)
- **Level** (0-10, mapped to form names: Egg, Hatchling, Juvenile, etc.)
- **TokenId** (for uniqueness seed)

Generated images are temporary URLs. They MUST be uploaded to IPFS immediately via `ipfs.service.ts`.

### IPFS Upload (`ipfs.service.ts`)

Uses **NFT.Storage** (free tier: 100GB/month). Uploads both:
1. Image file (from Replicate URL)
2. Metadata JSON (name, description, attributes, image IPFS URL)

Returns IPFS URIs in format: `ipfs://<CID>`. These are stored on-chain and in database.

### Contract Integration (`contract.service.ts`)

Uses **viem** for blockchain reads. Key functions:
- `getExtendedTokenData(tokenId)`: Returns owner, element, level, nonce, metadata URI in one call
- `getAuthorizedSigner()`: Returns contract's authorized signer address
- `getUserMintCount(address)`: Check if user already minted (max 1 per address)
- `isPaused()`: Check if contract is paused

Never writes to blockchain directly. Evolution writes happen via frontend using signed permits.

### Authentication (`middleware/auth.ts`)

Uses `@fastify/jwt` for JWT validation. Protected routes call `authenticateUser` hook which:
1. Verifies JWT token from `Authorization: Bearer <token>` header
2. Extracts user address from JWT payload
3. Attaches `userAddress` to request object

Login flow (`auth.routes.ts`):
1. Frontend requests nonce
2. User signs SIWE message with MetaMask
3. Backend verifies signature using `siwe` library
4. Returns JWT token valid for session

### Error Handling

- Uses Fastify's error handler (`server.ts`)
- Validation errors return 400 with Zod error details
- Authentication errors return 401
- Server errors return 500 (message hidden in production)
- All errors logged via `pino` logger

---

## Testing & Debugging

### Verify Signer Match

After deploying contract, verify backend signer matches:
```bash
curl http://localhost:3000/nft/contract/info | jq
```
Look for `signerMatches: true`. If false, update contract's authorized signer.

### Test Evolution Flow

Use provided shell scripts:
```bash
./test-evolution-flow.sh   # Full flow: mint → tasks → evolution
./test-mint.sh             # Just mint testing
```

### Database Inspection

```bash
psql $DATABASE_URL
\dt                                    # List tables
SELECT * FROM tasks WHERE required_level = 0;
SELECT * FROM task_completions WHERE status = 'approved';
SELECT * FROM evolution_history WHERE token_id = 42;
```

### Common Issues

**"Invalid signature"** on evolution:
- Check SIGNER_PRIVATE_KEY matches contract's authorized signer
- Verify domain separator matches contract (via `/nft/eip712/domain`)
- Check permit deadline hasn't expired

**AI generation timeout**:
- Replicate API has rate limits (50 predictions/month free tier)
- Use `test-ipfs-upload.ts` to verify IPFS works independently

**Database connection failed**:
- Ensure PostgreSQL is running (`docker-compose ps`)
- Verify DATABASE_URL format is correct
- Check migrations ran successfully (`npm run migrate`)

---

## Deployment Checklist

### Pre-Deploy
1. Deploy ElementalSouls smart contract to Monad
2. Copy deployed contract address to `.env` → `CONTRACT_ADDRESS`
3. Verify `SIGNER_PRIVATE_KEY` corresponds to address with `SIGNER_ROLE` in contract
4. Update `MONAD_RPC_URL` and `MONAD_CHAIN_ID`

### Production Setup
1. Use secrets manager (AWS Secrets Manager, etc.) for `SIGNER_PRIVATE_KEY`
2. Set `NODE_ENV=production`
3. Generate strong `JWT_SECRET` (min 32 chars)
4. Configure CORS for production frontend URLs
5. Enable stricter rate limiting
6. Set up PostgreSQL replicas for read scaling
7. Configure Redis for caching/job queues
8. Enable monitoring (Sentry, DataDog)

### Security
- Rotate `SIGNER_PRIVATE_KEY` monthly
- Never use signer wallet with real funds
- Monitor for unusual signature patterns
- Backup database regularly
- Test emergency pause procedure
- Use HTTPS in production

---

## Additional Documentation

- **Full setup guide**: `SETUP_GUIDE.md`
- **Contract integration**: `CONTRACT_INTEGRATION.md`
- **Optimizations**: `OPTIMIZATION_SUMMARY.md`
- **Recent fixes**: `FIXES_APPLIED.md`
- **Final setup**: `FINAL_SETUP.md`
- **Smart contract spec**: `../ELEMENTAL_SOULS_SPEC.txt`
- **API docs**: http://localhost:3000/docs (Swagger UI)
