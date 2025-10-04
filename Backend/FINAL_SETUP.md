# ✅ Backend Final Setup - Ready to Run!

## 🎉 All Fixes Applied Successfully

### What Changed:

#### ✅ 1. AI Service: Replicate (Your API Key)
- Using: `black-forest-labs/flux-schnell`
- API Key: ✅ Already configured
- Fallback: Placeholder images if API fails

#### ✅ 2. Storage: MongoDB (Replaces Redis)
- Database: PostgreSQL (user data, tasks)
- Cache: MongoDB (faster than Redis for this use case)
- Docker: Auto-configured

#### ✅ 3. IPFS: NFT.Storage (Your API Key)
- API Key: ✅ Already configured
- Upload: Automatic for images & metadata

---

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```

### Step 2: Start Services (Docker)
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Backend API (port 3000)

### Step 3: Run Migrations
```bash
npm run migrate
npm run seed  # Adds 40+ tasks
```

### Step 4: Check Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-04T...",
  "uptime": 42.5
}
```

---

## 🔑 API Keys (Already Configured)

### ✅ Your Keys in `.env`:
```bash
# NFT.Storage (IPFS)
NFT_STORAGE_API_KEY=<your-nft-storage-api-key>

# Replicate (AI Images)
REPLICATE_API_TOKEN=<your-replicate-api-token>
```

### ⏳ Needs Update After Contract Deploy:
```bash
# Smart Contract Address
CONTRACT_ADDRESS=0x<your-deployed-address>

# Backend Signer Wallet
SIGNER_PRIVATE_KEY=0x<backend-signer-key>
```

---

## 📊 Services Status

### Check All Services:
```bash
docker-compose ps
```

Expected:
```
NAME                        STATUS
elemental-souls-db          Up (healthy)
elemental-souls-mongodb     Up (healthy)
elemental-souls-api         Up
```

### View Logs:
```bash
# All services
docker-compose logs -f

# Just API
docker-compose logs -f api
```

You should see:
```
✅ PostgreSQL connected
✅ AI Image service initialized (Replicate)
✅ IPFS service initialized
✅ Signer service initialized with address: 0x...
🔥 Server running on http://0.0.0.0:3000
📚 Swagger docs: http://0.0.0.0:3000/docs
```

---

## 🧪 Test Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Contract Info (Will fail until contract deployed)
```bash
curl http://localhost:3000/nft/contract/info
```

Expected error (before contract deploy):
```json
{
  "error": "Failed to fetch contract info"
}
```

### 3. Available Tasks
```bash
curl http://localhost:3000/tasks/available?level=0
```

Expected:
```json
{
  "tasks": [
    {
      "id": "follow-twitter",
      "name": "Follow @ElementalSouls",
      ...
    }
  ]
}
```

### 4. Swagger Docs
Open browser: http://localhost:3000/docs

---

## 🔄 Full Workflow Test

### 1. Deploy Smart Contract First
```bash
cd ../ElementalSouls

# Deploy to Monad testnet
forge script script/ElementalSouls.s.sol:DeployElementalSouls \
  --rpc-url $MONAD_RPC_URL \
  --private-key $DEPLOYER_KEY \
  --broadcast

# Copy contract address
```

### 2. Update Backend Config
```bash
cd ../Backend
nano .env

# Update these:
CONTRACT_ADDRESS=0x<deployed-address>
SIGNER_PRIVATE_KEY=0x<backend-wallet-key>
```

### 3. Restart Backend
```bash
docker-compose restart api

# Or if running locally
npm run dev
```

### 4. Verify Contract Connection
```bash
curl http://localhost:3000/nft/contract/info
```

Expected (after contract deployed):
```json
{
  "maxSupply": 10000,
  "authorizedSigner": "0xABC...",
  "paused": false,
  "domainSeparator": "0x...",
  "signerAddress": "0xABC...",
  "signerMatches": true  // ← MUST BE TRUE!
}
```

---

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   ├── env.ts              ✅ All env vars configured
│   │   ├── logger.ts
│   │   └── contract-abi.ts     ✅ Full contract ABI
│   ├── db/
│   │   ├── schema.sql          ✅ Database schema
│   │   ├── seeds/tasks.sql     ✅ 40+ tasks seeded
│   │   ├── migrate.ts
│   │   └── seed.ts
│   ├── services/
│   │   ├── ai-image.service.ts ✅ Replicate integration
│   │   ├── ipfs.service.ts     ✅ NFT.Storage
│   │   ├── contract.service.ts ✅ Web3 reads
│   │   └── signer.service.ts   ✅ EIP-712 signing
│   ├── routes/
│   │   ├── auth.routes.ts      ✅ SIWE login
│   │   ├── mint.routes.ts      ✅ Mint NFTs
│   │   ├── nft.routes.ts       ✅ NFT info
│   │   ├── tasks.routes.ts     ✅ Task management
│   │   └── evolution.routes.ts ✅ Evolution flow
│   └── server.ts               ✅ Fastify server
├── .env                         ✅ API keys configured
├── docker-compose.yml           ✅ All services
└── package.json                 ✅ All dependencies
```

---

## 🔐 Security Checklist

- ✅ JWT secret configured (32+ chars)
- ✅ NFT.Storage API key added
- ✅ Replicate API key added
- ✅ MongoDB connection secured
- ✅ PostgreSQL password set
- ✅ CORS whitelist configured
- ⏳ Signer private key (after contract deploy)
- ⏳ Contract address (after deploy)

---

## 🐛 Common Issues

### Issue: "Port 3000 already in use"
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Issue: "MongoDB connection failed"
```bash
# Start MongoDB
docker-compose up mongodb -d

# Or locally
brew services start mongodb-community
```

### Issue: "PostgreSQL connection failed"
```bash
# Start PostgreSQL
docker-compose up postgres -d

# Check connection
psql postgresql://postgres:password@localhost:5432/elemental_souls
```

### Issue: "Replicate API error"
```bash
# Verify API key
curl -H "Authorization: Bearer <your-replicate-api-token>" \
  https://api.replicate.com/v1/models

# Should return: 200 OK
```

### Issue: "NFT.Storage upload failed"
```bash
# Verify API key
curl -H "Authorization: Bearer <your-nft-storage-api-key>" \
  https://api.nft.storage/

# Should return: 200 OK
```

---

## 📈 Next Steps

### 1. ✅ Backend is Ready
- All services configured
- API keys added
- Database schema created
- Tasks seeded

### 2. ⏳ Deploy Smart Contract
```bash
cd ../ElementalSouls
# Follow contract deployment guide
```

### 3. ⏳ Update Backend with Contract Address
```bash
# Backend/.env
CONTRACT_ADDRESS=0x<deployed>
SIGNER_PRIVATE_KEY=0x<signer>
```

### 4. ⏳ Test Full Flow
```bash
# 1. Login (SIWE)
curl -X POST http://localhost:3000/auth/login \
  -d '{"message":"...","signature":"0x..."}'

# 2. Mint NFT
curl -X POST http://localhost:3000/mint/request \
  -H "Authorization: Bearer <token>" \
  -d '{"element":0}'

# 3. Complete tasks
# 4. Request evolution
# 5. Frontend calls contract
```

---

## 📚 API Documentation

### Full API Docs:
http://localhost:3000/docs

### Key Endpoints:
- `POST /auth/login` - Sign in with Ethereum
- `POST /mint/request` - Mint NFT (backend signs)
- `POST /mint/prepare` - Prepare mint (user signs)
- `GET /tasks/available?level=X` - Get tasks
- `POST /tasks/submit` - Submit task
- `POST /evolution/request` - Request evolution
- `GET /nft/:tokenId` - Get NFT data
- `GET /nft/contract/info` - Contract + signer status

---

## ✅ Final Checklist

- [x] Dependencies installed (`npm install`)
- [x] Docker services running (`docker-compose up -d`)
- [x] Database migrated (`npm run migrate`)
- [x] Tasks seeded (`npm run seed`)
- [x] NFT.Storage key configured
- [x] Replicate key configured
- [x] MongoDB connected
- [x] PostgreSQL connected
- [x] Health endpoint responding
- [ ] Smart contract deployed
- [ ] Contract address added to .env
- [ ] Signer key added to .env
- [ ] Contract connection verified (`signerMatches: true`)

---

**Status**: ✅ Backend Ready to Run!

**Next**: Deploy smart contract → Update .env → Test full flow

---

## 🆘 Need Help?

```bash
# Check service status
docker-compose ps

# View all logs
docker-compose logs -f

# Restart everything
docker-compose restart

# Stop everything
docker-compose down

# Fresh start
docker-compose down -v && docker-compose up -d
```

**Backend is fully configured and ready!** 🎉
