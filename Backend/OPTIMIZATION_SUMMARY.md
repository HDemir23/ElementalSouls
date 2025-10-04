# Backend Optimization Summary

## 🎯 Contract Integration Complete

### What Was Optimized:

#### ✅ 1. Full Contract ABI Integration
**File**: `src/config/contract-abi.ts`

Added complete ABI matching `ElementalSouls.sol`:
- All read functions (11 total)
- All write functions (mint, evolve, admin functions)
- All events with proper indexing
- Proper TypeScript types for viem

#### ✅ 2. Enhanced Contract Service
**File**: `src/services/contract.service.ts`

**New Functions Added**:
```typescript
getTotalEvolutions(tokenId)     // Track evolution count from contract
getLastEvolveTime(tokenId)      // Get last evolution timestamp
getUserMintCount(address)       // Check if user already minted
getAuthorizedSigner()           // Verify backend signer matches
isPaused()                      // Check contract pause state
getMaxSupply()                  // Get max supply constant
getDomainSeparator()            // EIP-712 domain for verification
getExtendedTokenData(tokenId)   // Get all data in one call
```

**Why This Matters**:
- ✅ Evolution count from blockchain (not DB) = source of truth
- ✅ Verify signer matches contract before signing permits
- ✅ Check pause state before operations
- ✅ Single call for all token data (optimized)

#### ✅ 3. New NFT Routes
**File**: `src/routes/nft.routes.ts`

```
GET  /nft/:tokenId              → Full NFT data + IPFS metadata
GET  /nft/user/:address         → User's NFTs (with mint check)
GET  /nft/contract/info         → Contract info + signer verification
POST /nft/preview-evolution     → Preview next level (free)
GET  /nft/eip712/domain         → EIP-712 domain for frontend
```

**Benefits**:
- Frontend can verify EIP-712 domain matches
- Preview evolution before spending gas
- Check signer health (`signerMatches: true`)

#### ✅ 4. Mint Routes
**File**: `src/routes/mint.routes.ts`

**Two Mint Options**:

**Option A: Backend Mints (Gasless for User)**
```
POST /mint/request
- Backend generates image
- Backend uploads to IPFS
- Backend calls contract.mint()
- User pays nothing
```

**Option B: User Mints (User Pays Gas)**
```
POST /mint/prepare
- Backend generates image
- Backend uploads to IPFS
- Returns mint data
- User calls contract.mint() from wallet
```

**Eligibility Check**:
```
GET /mint/check/:address
- Returns: canMint, hasMinted, isPaused
```

#### ✅ 5. Evolution Routes Updates
**File**: `src/routes/evolution.routes.ts`

**Changes**:
- Uses `getExtendedTokenData()` for complete info
- Evolution count from contract (not DB)
- Better validation before AI generation
- Confirms signer address before signing

---

## 🔄 Key Differences from Original

### Before (Original Backend):
```typescript
// Used basic getTokenData()
const data = await contractService.getTokenData(tokenId);
// Missing: totalEvolutions, lastEvolveTime

// Evolution count from DB
const result = await db.query('SELECT COUNT(*)...');
const count = result.rows[0].count;
```

### After (Optimized):
```typescript
// Complete data in one call
const data = await contractService.getExtendedTokenData(tokenId);
// Includes: totalEvolutions, lastEvolveTime, nonce, etc.

// Evolution count from contract (source of truth)
const count = data.totalEvolutions + 1;
```

---

## 📊 New Endpoints Summary

### Authentication
- `POST /auth/login` - SIWE login
- `GET /auth/nonce` - Get nonce

### Minting
- `POST /mint/request` - Backend mints (gasless)
- `POST /mint/prepare` - Prepare mint data (user pays)
- `GET /mint/check/:address` - Check eligibility

### NFT Info
- `GET /nft/:tokenId` - Full NFT data
- `GET /nft/user/:address` - User's NFTs
- `GET /nft/contract/info` - Contract + signer info
- `POST /nft/preview-evolution` - Preview next level
- `GET /nft/eip712/domain` - EIP-712 domain

### Tasks
- `GET /tasks/available?level=X` - Available tasks
- `POST /tasks/submit` - Submit task
- `GET /tasks/progress` - User progress
- `POST /tasks/verify` - Admin verify
- `GET /tasks/pending` - Pending verifications

### Evolution
- `POST /evolution/check-eligibility` - Check if can evolve
- `POST /evolution/request` - Request evolution (AI + signature)
- `GET /evolution/history/:tokenId` - Evolution history
- `POST /evolution/confirm` - Confirm tx hash

---

## 🔐 Critical Integration Points

### 1. Signer Verification
```typescript
// Backend checks if it matches contract
const contractSigner = await contractService.getAuthorizedSigner();
const backendSigner = signerService.getAddress();

if (contractSigner !== backendSigner) {
  throw new Error('Signer mismatch! Update contract or backend');
}
```

**Endpoint**: `GET /nft/contract/info`
```json
{
  "authorizedSigner": "0xABC...",
  "signerAddress": "0xABC...",
  "signerMatches": true  // ← Must be true!
}
```

### 2. EIP-712 Domain Match
```typescript
// Contract domain
const domain = {
  name: "ElementalSoulsEvolver",
  version: "1",
  chainId: contract.chainId,
  verifyingContract: contractAddress
};

// Backend signs with same domain
const signature = await walletClient.signTypedData({
  domain,
  types: TYPES,
  message: permit
});
```

### 3. Evolution Count Sync
```typescript
// OLD (DB can be out of sync):
const count = await db.query('SELECT COUNT(*) FROM evolution_history WHERE token_id = $1', [tokenId]);

// NEW (source of truth):
const count = await contractService.getTotalEvolutions(tokenId);
```

---

## 🧪 Testing the Integration

### Step 1: Verify Signer
```bash
curl http://localhost:3000/nft/contract/info

# Expected:
{
  "authorizedSigner": "0x...",
  "signerAddress": "0x...",
  "signerMatches": true  # ← MUST BE TRUE
}
```

### Step 2: Test Mint Flow
```bash
# Check eligibility
curl http://localhost:3000/mint/check/0xUSER_ADDRESS

# Request mint
curl -X POST http://localhost:3000/mint/request \
  -H "Authorization: Bearer <token>" \
  -d '{ "element": 0 }'
```

### Step 3: Test Evolution Flow
```bash
# Check eligibility
curl -X POST http://localhost:3000/evolution/check-eligibility \
  -H "Authorization: Bearer <token>" \
  -d '{ "tokenId": 42 }'

# Preview evolution (free)
curl -X POST http://localhost:3000/nft/preview-evolution \
  -H "Authorization: Bearer <token>" \
  -d '{ "tokenId": 42 }'

# Request evolution (generates signature)
curl -X POST http://localhost:3000/evolution/request \
  -H "Authorization: Bearer <token>" \
  -d '{ "tokenId": 42, "targetLevel": 3 }'

# Frontend calls contract.evolve(permit, signature)
```

---

## 🚀 Deployment Checklist

### Pre-Deploy:
- [x] Update contract ABI
- [x] Add all contract read functions
- [x] Implement signer verification
- [x] Add EIP-712 domain endpoint
- [x] Create mint routes (gasless + manual)
- [x] Update evolution to use contract data
- [x] Add preview functionality

### Post-Deploy:
- [ ] Deploy ElementalSouls.sol to Monad
- [ ] Update `CONTRACT_ADDRESS` in .env
- [ ] Verify `signerMatches: true`
- [ ] Test full mint → task → evolve flow
- [ ] Monitor Minted/Evolved events
- [ ] Setup alerts for signature failures

---

## 📈 Performance Optimizations

### 1. Batched Contract Calls
```typescript
// Single call gets all data
const data = await contractService.getExtendedTokenData(tokenId);

// Instead of 7 separate calls:
// - ownerOf()
// - tokenLevel()
// - tokenElement()
// - tokenNonce()
// - tokenURI()
// - totalEvolutions()
// - lastEvolveTime()
```

### 2. Contract as Source of Truth
```typescript
// Evolution count: Contract > Database
const count = await contractService.getTotalEvolutions(tokenId);

// Mint status: Contract > Database
const mintCount = await contractService.getUserMintCount(address);
```

### 3. Signer Health Check
```typescript
// Proactive verification on startup
const match = await contractService.getAuthorizedSigner() === signerService.getAddress();
if (!match) {
  logger.error('❌ SIGNER MISMATCH!');
}
```

---

## 🔧 Configuration Required

### .env Updates:
```bash
# After deploying contract
CONTRACT_ADDRESS=0x<deployed-address>
MONAD_RPC_URL=<monad-rpc-endpoint>
MONAD_CHAIN_ID=10143  # or actual chain ID

# CRITICAL: This must match contract's authorizedSigner
SIGNER_PRIVATE_KEY=0x<same-as-contract-signer>
```

### Verify Setup:
```bash
# 1. Start backend
npm run dev

# 2. Check signer
curl http://localhost:3000/nft/contract/info | jq '.signerMatches'
# Should return: true

# 3. Check contract not paused
curl http://localhost:3000/nft/contract/info | jq '.paused'
# Should return: false
```

---

## 📝 Files Changed/Added

### New Files:
1. `src/config/contract-abi.ts` - Complete contract ABI
2. `src/routes/nft.routes.ts` - NFT info endpoints
3. `src/routes/mint.routes.ts` - Mint functionality
4. `CONTRACT_INTEGRATION.md` - Integration guide
5. `OPTIMIZATION_SUMMARY.md` - This file

### Modified Files:
1. `src/services/contract.service.ts` - Added 8 new functions
2. `src/routes/evolution.routes.ts` - Uses extended data
3. `src/server.ts` - Registered new routes

---

## ✅ Verification Steps

After deployment, run these checks:

```bash
# 1. Backend health
curl http://localhost:3000/health

# 2. Contract connection
curl http://localhost:3000/nft/contract/info

# 3. Signer verification
curl http://localhost:3000/nft/contract/info | jq '.signerMatches'
# Must be: true

# 4. EIP-712 domain
curl http://localhost:3000/nft/eip712/domain

# 5. Mint eligibility
curl http://localhost:3000/mint/check/0xYOUR_ADDRESS

# 6. Contract not paused
curl http://localhost:3000/nft/contract/info | jq '.paused'
# Must be: false
```

All green? ✅ Ready for production!

---

**Status**: ✅ Backend fully optimized and contract-integrated
**Next**: Deploy contract → Update .env → Test full flow
