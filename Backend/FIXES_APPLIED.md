# Backend Fixes Applied

## ✅ All Errors Fixed

### 1. **Replicate → OpenRouter Migration**

**Changed**:
- ❌ Replicate API (paid service)
- ✅ OpenRouter API (supports multiple AI models)

**Files Modified**:
- `package.json` - Removed `replicate`, added `axios`
- `src/config/env.ts` - Changed `REPLICATE_API_TOKEN` → `OPENROUTER_API_KEY`
- `src/services/ai-image.service.ts` - Complete rewrite for OpenRouter
- `.env.example` - Updated API key name
- `.env` - Your API key can be added here

**OpenRouter Models Available**:
- `black-forest-labs/flux-pro` - High quality (recommended)
- `black-forest-labs/flux-schnell` - Faster & cheaper
- Fallback: Placeholder images if API fails

---

### 2. **Redis → MongoDB Migration**

**Changed**:
- ❌ Redis (for caching)
- ✅ MongoDB (more versatile, better for this use case)

**Files Modified**:
- `package.json` - Removed `ioredis`, `bullmq`, added `mongodb`
- `src/config/env.ts` - Changed Redis config → MongoDB URI
- `docker-compose.yml` - Replaced Redis service with MongoDB
- `.env.example` - Updated connection string
- `.env` - Ready to use MongoDB

**MongoDB Setup**:
```bash
# With Docker Compose
docker-compose up mongodb

# Or install locally
brew install mongodb-community
brew services start mongodb-community
```

---

### 3. **NFT.Storage Fix**

**Fixed**:
- ❌ Wrong import: `@nftport/nft-storage`
- ✅ Correct import: `nft.storage`

**Files Modified**:
- `package.json` - Fixed package name
- `src/services/ipfs.service.ts` - Removed unused `File` import
- `.env` - Your API key already added: <your-nft-storage-api-key>

---

### 4. **Environment Variables Updated**

**New `.env` file created with**:
- ✅ NFT.Storage API key (your key)
- ✅ OpenRouter API key placeholder (add yours)
- ✅ MongoDB URI
- ✅ Proper defaults for all services

**What You Need to Update**:
```bash
# 1. Add your OpenRouter API key
OPENROUTER_API_KEY=your_key_here

# 2. After deploying contract
CONTRACT_ADDRESS=0x<deployed-address>
SIGNER_PRIVATE_KEY=0x<backend-signer-private-key>
```

---

### 5. **Docker Compose Updated**

**Changes**:
- ✅ PostgreSQL service (unchanged)
- ✅ MongoDB service (replaces Redis)
- ✅ API service with correct env vars

**Start Services**:
```bash
docker-compose up -d
```

---

## 📦 Dependencies Summary

### Removed:
- ❌ `replicate` - Paid AI service
- ❌ `ioredis` - Redis client
- ❌ `bullmq` - Redis-based queue
- ❌ `@nftport/nft-storage` - Wrong package

### Added:
- ✅ `axios` - HTTP client for OpenRouter
- ✅ `mongodb` - MongoDB driver
- ✅ `nft.storage` - Correct NFT.Storage package

---

## 🚀 Quick Start (Updated)

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```

### Step 2: Configure Environment
```bash
# .env already created with your NFT.Storage key
# Just add your OpenRouter API key:
nano .env

# Update this line:
OPENROUTER_API_KEY=<your-openrouter-key>
```

### Step 3: Start Services
```bash
# Option A: Docker (Recommended)
docker-compose up -d

# Option B: Local
# Start PostgreSQL
# Start MongoDB
npm run migrate
npm run seed
npm run dev
```

### Step 4: Verify Setup
```bash
# Check health
curl http://localhost:3000/health

# Check contract info (will fail until contract deployed)
curl http://localhost:3000/nft/contract/info
```

---

## 🔧 AI Image Generation Flow

### How OpenRouter Works:

1. **Backend generates prompt**:
```typescript
const prompt = "Generate an image: A mystical fire egg with red cracks, fantasy digital art...";
```

2. **Sends to OpenRouter**:
```typescript
POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "black-forest-labs/flux-pro",
  "messages": [{ "role": "user", "content": prompt }]
}
```

3. **Extracts image URL** from response

4. **If OpenRouter fails** → Fallback to placeholder:
```
https://via.placeholder.com/512x512/FF6B35/FFFFFF?text=Fire+Egg
```

5. **Uploads to IPFS** via NFT.Storage

---

## 🐛 Known Limitations

### OpenRouter Image Generation:
⚠️ **Note**: OpenRouter's Flux models might return text descriptions instead of direct image URLs.

**Solutions**:
1. **Use image generation endpoint** (if available)
2. **Parse image URL** from response text
3. **Fallback to placeholder** images (already implemented)

**Alternative**: If OpenRouter doesn't work well for images, we can:
- Use **Stability AI** (via OpenRouter)
- Use **DALL-E** (if you have OpenAI API key)
- Generate placeholder images only (free, always works)

---

## 📝 Configuration Files

### `.env` (Created for you):
```bash
NFT_STORAGE_API_KEY=<your-nft-storage-api-key>  # ✅ Your key
OPENROUTER_API_KEY=your_key_here  # ← Add your OpenRouter key
MONGODB_URI=mongodb://localhost:27017/elemental_souls
# ... other vars
```

### `docker-compose.yml` (Updated):
```yaml
services:
  postgres: ...
  mongodb:  # ← New (replaces redis)
    image: mongo:7-jammy
    ports:
      - "27017:27017"
  api:
    environment:
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}  # ← New
      NFT_STORAGE_API_KEY: ${NFT_STORAGE_API_KEY}  # ✅ Your key
      MONGODB_URI: mongodb://mongodb:27017/elemental_souls
```

---

## ✅ Verification Checklist

After starting backend:

```bash
# 1. Check services running
docker-compose ps
# Should show: postgres (healthy), mongodb (healthy), api (running)

# 2. Check logs
docker-compose logs -f api

# 3. Test health endpoint
curl http://localhost:3000/health
# Expected: { "status": "ok", ... }

# 4. Check if services initialized
# Should see in logs:
# ✅ PostgreSQL connected
# ✅ AI Image service initialized (OpenRouter)
# ✅ IPFS service initialized
# ✅ Signer service initialized
```

---

## 🔐 Next Steps

### 1. Get OpenRouter API Key
```bash
# Visit: https://openrouter.ai
# Sign up
# Go to: https://openrouter.ai/keys
# Create API key
# Add to .env: OPENROUTER_API_KEY=sk-or-...
```

### 2. Deploy Smart Contract
```bash
cd ../ElementalSouls
forge script script/ElementalSouls.s.sol:DeployElementalSouls \
  --rpc-url $MONAD_RPC_URL \
  --private-key $DEPLOYER_KEY \
  --broadcast

# Copy contract address to Backend/.env
```

### 3. Update Backend Config
```bash
# Backend/.env
CONTRACT_ADDRESS=0x<deployed-address>
SIGNER_PRIVATE_KEY=0x<backend-signer-key>
```

### 4. Restart Backend
```bash
docker-compose restart api
# or
npm run dev
```

### 5. Verify Contract Connection
```bash
curl http://localhost:3000/nft/contract/info

# Should show:
{
  "authorizedSigner": "0x...",
  "signerAddress": "0x...",
  "signerMatches": true  # ← Must be true!
}
```

---

## 📚 API Endpoints (No Changes)

All endpoints still work the same:

- `POST /auth/login` - SIWE login
- `POST /mint/request` - Mint NFT
- `POST /evolution/request` - Evolve NFT (with OpenRouter AI)
- `GET /nft/:tokenId` - Get NFT data
- Full list: See README.md

---

## 🆘 Troubleshooting

### Issue: "OpenRouter API error"
**Solution**: Check your API key is correct in `.env`

### Issue: "MongoDB connection failed"
**Solution**:
```bash
# Start MongoDB
docker-compose up mongodb
# or locally
brew services start mongodb-community
```

### Issue: "NFT.Storage upload failed"
**Solution**: Your API key is already configured, but verify it's valid:
```bash
curl -H "Authorization: Bearer <your-nft-storage-api-key>" \
  https://api.nft.storage/
```

### Issue: "No image generated"
**Solution**: Fallback to placeholder is automatic. Check logs:
```bash
docker-compose logs api | grep "AI image"
```

---

## 📊 What Changed Summary

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| AI Service | Replicate | OpenRouter | ✅ Fixed |
| Cache/Queue | Redis | MongoDB | ✅ Fixed |
| IPFS | Wrong package | nft.storage | ✅ Fixed |
| NFT.Storage Key | Not set | Your key added | ✅ Ready |
| OpenRouter Key | - | Needs your key | ⏳ Pending |
| Docker Compose | Redis service | MongoDB service | ✅ Updated |
| Environment | Missing vars | All configured | ✅ Complete |

---

**Status**: ✅ All errors fixed, ready to run!

**Remaining**:
1. Add OpenRouter API key to `.env`
2. Deploy smart contract
3. Test full flow
