# Elemental Souls Backend - Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd Backend
npm install
```

### Step 2: Setup Environment

```bash
# Copy example env file
cp .env.example .env
```

**Edit `.env` and fill in these REQUIRED values:**

```bash
# Get these from Monad deployment
CONTRACT_ADDRESS=0x...
MONAD_RPC_URL=https://testnet.monad.xyz

# Create new wallet for backend signer
SIGNER_PRIVATE_KEY=0x...

# Get from https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=r8_...

# Get from https://nft.storage/manage/
NFT_STORAGE_API_KEY=eyJ...

# Generate random 32+ char string
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

### Step 3: Start with Docker (Recommended)

```bash
# Start PostgreSQL + Redis + API
docker-compose up -d

# Check logs
docker-compose logs -f api

# API ready at http://localhost:3000
# Docs at http://localhost:3000/docs
```

**OR** Manual Setup:

```bash
# Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16-alpine

# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Run migrations
npm run migrate

# Seed tasks
npm run seed

# Start dev server
npm run dev
```

## 📋 Getting API Keys

### 1. NFT.Storage (Free)

1. Visit https://nft.storage/
2. Click "Sign Up" (GitHub login)
3. Go to "API Keys"
4. Create new key
5. Copy to `.env`

### 2. Replicate (Free tier: 50 predictions/month)

1. Visit https://replicate.com
2. Sign up
3. Go to https://replicate.com/account/api-tokens
4. Create token
5. Copy to `.env`

### 3. Backend Signer Wallet

```bash
# Generate new wallet (or use existing)
# NEVER use wallet with real funds!

# Option 1: Using cast (Foundry)
cast wallet new

# Option 2: Using ethers.js
node -e "console.log(require('ethers').Wallet.createRandom())"

# Copy private key to .env
```

## 🧪 Testing the API

### 1. Check Health

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-04T...",
  "uptime": 42.123
}
```

### 2. Get Available Tasks

```bash
curl http://localhost:3000/tasks/available?level=0
```

### 3. Test SIWE Login

```bash
# Get nonce
curl http://localhost:3000/auth/nonce

# Sign message in frontend
# POST to /auth/login with signature
```

### 4. View Swagger Docs

Open browser: http://localhost:3000/docs

## 🔧 Common Issues

### Issue: Database connection failed

```bash
# Check PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Verify connection
psql postgresql://postgres:password@localhost:5432/elemental_souls
```

### Issue: "Invalid signer private key"

```bash
# Private key MUST:
# - Start with 0x
# - Be 64 hex characters (66 total with 0x)
# - Example: 0x1234567890abcdef...

# Verify in .env:
SIGNER_PRIVATE_KEY=0xabcd1234... (66 chars total)
```

### Issue: CORS error from frontend

```bash
# Add frontend URL to .env:
CORS_ORIGIN=http://localhost:3001,https://yourdomain.com
```

### Issue: NFT.Storage upload fails

```bash
# Check API key is valid
# Verify free tier quota (100GB/month)
# Try smaller test image first
```

## 📊 Database Management

### View Tables

```bash
psql postgresql://postgres:password@localhost:5432/elemental_souls

# List tables
\dt

# View tasks
SELECT * FROM tasks LIMIT 5;

# View completions
SELECT * FROM task_completions;

# Exit
\q
```

### Reset Database

```bash
# Drop and recreate
docker-compose down -v
docker-compose up -d

# Re-run migrations
npm run migrate
npm run seed
```

### Backup Database

```bash
pg_dump -U postgres -d elemental_souls > backup.sql

# Restore
psql -U postgres -d elemental_souls < backup.sql
```

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to random 32+ char string
- [ ] Never commit `.env` file
- [ ] Use separate wallet for SIGNER_PRIVATE_KEY (no real funds)
- [ ] Enable rate limiting in production
- [ ] Use HTTPS in production
- [ ] Rotate API keys regularly
- [ ] Use secrets manager in production (AWS Secrets Manager, etc.)

## 📦 Deployment to Production

### Railway

```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Add environment variables in dashboard
railway variables set CONTRACT_ADDRESS=0x...
railway variables set SIGNER_PRIVATE_KEY=0x...
# ... (add all from .env)

# Deploy
railway up
```

### Render

1. Create account at https://render.com
2. New > Web Service
3. Connect GitHub repo
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variables
7. Deploy

### Custom VPS (Ubuntu)

```bash
# Install dependencies
sudo apt update
sudo apt install postgresql redis docker docker-compose

# Clone repo
git clone <repo>
cd Backend

# Setup env
cp .env.example .env
nano .env

# Run with Docker
docker-compose up -d

# Setup nginx reverse proxy (optional)
```

## 🧩 Integration with Smart Contract

1. Deploy smart contract to Monad testnet
2. Copy contract address to `.env` → `CONTRACT_ADDRESS`
3. Verify signer address matches contract's authorized signer:

```bash
# Get backend signer address
curl http://localhost:3000/health | jq

# In smart contract, verify this address has SIGNER_ROLE
```

## 📈 Monitoring

### Logs

```bash
# Docker logs
docker-compose logs -f api

# File logs (if configured)
tail -f logs/app.log
```

### Metrics

```bash
# Health check
curl http://localhost:3000/health

# Database stats
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM task_completions WHERE status = 'approved';
SELECT COUNT(*) FROM evolution_history;
```

## 🆘 Support

If stuck:

1. Check logs: `docker-compose logs -f api`
2. Verify all `.env` variables are set
3. Test database connection manually
4. Check API keys are valid
5. Review Swagger docs at `/docs`

## Next Steps

Once backend is running:

1. ✅ Test all endpoints via Swagger
2. ✅ Deploy smart contract and update CONTRACT_ADDRESS
3. ✅ Setup frontend to connect to this API
4. ✅ Test full flow: login → tasks → evolution
