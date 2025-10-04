# Elemental Souls - Backend API

Backend service for the Elemental Souls NFT Evolution Platform on Monad blockchain.

## Features

- 🔐 **Authentication**: Sign-In With Ethereum (SIWE) + JWT
- 📝 **Task Management**: Create, verify, and track task completions
- 🎨 **AI Image Generation**: Replicate API integration for unique NFT evolution
- 📦 **IPFS Storage**: NFT.Storage for decentralized metadata/images
- ✍️ **EIP-712 Signatures**: Secure evolution permits signed by backend
- 🗄️ **PostgreSQL Database**: Persistent storage for tasks, completions, history
- ⚡ **Redis Cache**: Fast caching and job queue support
- 📚 **Swagger Docs**: Auto-generated API documentation

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify 4
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Web3**: viem 2.x
- **AI**: Replicate API (Flux-Schnell)
- **Storage**: NFT.Storage (IPFS)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7
- NFT.Storage API key
- Replicate API token
- Monad RPC URL

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
nano .env
```

### Database Setup

```bash
# Run migrations
npm run migrate

# (Optional) Seed tasks
psql -U postgres -d elemental_souls -f src/db/seeds/tasks.sql
```

### Development

```bash
# Start development server with hot reload
npm run dev

# API will be available at http://localhost:3000
# Swagger docs at http://localhost:3000/docs
```

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Docker Deployment

```bash
# Start all services (PostgreSQL + Redis + API)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- `POST /auth/login` - Sign in with SIWE
- `GET /auth/nonce` - Get nonce for SIWE message

### Minting
- `POST /mint/request` - Backend mints NFT (gasless for user)
- `POST /mint/prepare` - Prepare mint data (user pays gas)
- `GET /mint/check/:address` - Check mint eligibility

### NFT Information
- `GET /nft/:tokenId` - Get full NFT data + metadata
- `GET /nft/user/:address` - Get user's NFTs
- `GET /nft/contract/info` - Contract info + signer verification
- `POST /nft/preview-evolution` - Preview next evolution (no cost)
- `GET /nft/eip712/domain` - EIP-712 domain for frontend

### Tasks
- `GET /tasks/available?level=X` - Get available tasks for level
- `POST /tasks/submit` - Submit task completion
- `GET /tasks/progress?level=X` - Get task progress
- `GET /tasks/pending` - Get pending verifications (admin)
- `POST /tasks/verify` - Verify task completion (admin)

### Evolution
- `POST /evolution/check-eligibility` - Check if eligible to evolve
- `POST /evolution/request` - Request evolution (generates AI image + signature)
- `GET /evolution/history/:tokenId` - Get evolution history
- `POST /evolution/confirm` - Confirm on-chain evolution with tx hash

### Utility
- `GET /health` - Health check
- `GET /docs` - Swagger UI documentation

## Environment Variables

See `.env.example` for all required variables.

### Critical Variables

```bash
# Smart Contract
CONTRACT_ADDRESS=0x...           # Deployed ElementalSouls contract
MONAD_RPC_URL=https://...        # Monad RPC endpoint
SIGNER_PRIVATE_KEY=0x...         # Backend wallet for signing permits

# External Services
REPLICATE_API_TOKEN=r8_...       # Replicate API token
NFT_STORAGE_API_KEY=eyJ...       # NFT.Storage API key

# Security
JWT_SECRET=<random-32-char>      # JWT signing secret
```

## Project Structure

```
src/
├── config/           # Configuration (env, logger)
├── db/               # Database (client, migrations, seeds)
├── middleware/       # Middleware (auth)
├── routes/           # API routes
├── services/         # Business logic
│   ├── signer.service.ts       # EIP-712 signing
│   ├── contract.service.ts     # Blockchain reads
│   ├── ai-image.service.ts     # AI generation
│   └── ipfs.service.ts         # IPFS uploads
├── types/            # TypeScript types
├── utils/            # Utilities
└── server.ts         # Main server
```

## Architecture Flow

### Evolution Workflow

```
1. User completes tasks
   ↓
2. Backend verifies task completion
   ↓
3. User requests evolution (/evolution/request)
   ↓
4. Backend checks eligibility (task count)
   ↓
5. Generate AI image (Replicate)
   ↓
6. Upload to IPFS (NFT.Storage)
   ↓
7. Create EIP-712 evolution permit
   ↓
8. Sign permit with backend wallet
   ↓
9. Return signed permit to frontend
   ↓
10. Frontend submits to smart contract
    ↓
11. User confirms transaction
    ↓
12. Backend records tx hash (/evolution/confirm)
```

## Task Requirements Per Level

| Level | Tasks Needed | Total Points |
|-------|--------------|--------------|
| 0→1   | 3            | ~50          |
| 1→2   | 5            | ~150         |
| 2→3   | 7            | ~300         |
| 3→4   | 10           | ~500         |
| 4→5   | 12           | ~750         |
| 5→6   | 15           | ~1,100       |
| 6→7   | 18           | ~1,500       |
| 7→8   | 22           | ~2,000       |
| 8→9   | 25           | ~2,700       |
| 9→10  | 30           | ~3,500       |

## Security

- ✅ JWT authentication on protected routes
- ✅ Rate limiting (100 req/min default)
- ✅ CORS whitelist
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (parameterized queries)
- ✅ EIP-712 signature replay protection (nonce + deadline)
- ✅ Private key stored in env (use Secrets Manager in production)

## Testing

```bash
# Run tests
npm test

# Test specific service
npm test -- src/services/signer.service.test.ts
```

## Deployment

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Render

1. Connect GitHub repo
2. Add environment variables
3. Deploy

### AWS ECS

See `Dockerfile` for container build.

## Monitoring

- Logs: `docker-compose logs -f api`
- Health: `curl http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

### AI Generation Timeout

- Check Replicate API token
- Verify API quota not exceeded
- Try different model (SDXL-Lightning)

### IPFS Upload Failed

- Check NFT.Storage API key
- Verify free tier quota (100GB/month)

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Submit pull request

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [link]
- Discord: [link]
- Email: [email]
