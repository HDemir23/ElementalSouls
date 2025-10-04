# ElementalSouls Contract Integration Guide

## ✅ Backend Optimizations Complete

### Changes Made:

#### 1. **Complete Contract ABI** (`src/config/contract-abi.ts`)
- ✅ All read functions from contract
- ✅ All write functions (mint, evolve, updateSigner, togglePause)
- ✅ All events (Minted, Evolved, SignerUpdated, EmergencyPause, EvolutionMilestone)

#### 2. **Enhanced Contract Service** (`src/services/contract.service.ts`)
Added missing read functions:
- ✅ `getTotalEvolutions()` - Track evolution count
- ✅ `getLastEvolveTime()` - Get last evolution timestamp
- ✅ `getUserMintCount()` - Check if user already minted
- ✅ `getAuthorizedSigner()` - Verify backend signer matches contract
- ✅ `isPaused()` - Check contract pause state
- ✅ `getMaxSupply()` - Get max supply constant
- ✅ `getDomainSeparator()` - EIP-712 domain separator
- ✅ `getExtendedTokenData()` - Get all token data in one call

#### 3. **New NFT Routes** (`src/routes/nft.routes.ts`)
```
GET  /nft/:tokenId              - Get full NFT data + metadata
GET  /nft/user/:address         - Get user's NFTs
GET  /nft/contract/info         - Contract info + signer verification
POST /nft/preview-evolution     - Preview next level (no cost)
GET  /nft/eip712/domain         - EIP-712 domain for frontend
```

#### 4. **Mint Routes** (`src/routes/mint.routes.ts`)
```
POST /mint/request              - Backend mints for user (gasless)
POST /mint/prepare              - Prepare mint data (user pays gas)
GET  /mint/check/:address       - Check mint eligibility
```

#### 5. **Updated Evolution Routes**
- ✅ Uses `getExtendedTokenData()` for complete info
- ✅ Evolution count from contract (not DB)
- ✅ Better error handling

---

## 🔧 Deployment Steps

### Step 1: Deploy Smart Contract

```bash
cd ElementalSouls

# Deploy to Monad testnet
forge script script/ElementalSouls.s.sol:DeployElementalSouls \
  --rpc-url $MONAD_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast

# Note the deployed contract address
```

### Step 2: Configure Backend

```bash
cd Backend

# Update .env with deployed contract
CONTRACT_ADDRESS=0x<deployed-address>
MONAD_RPC_URL=<monad-rpc>
MONAD_CHAIN_ID=10143  # or actual Monad chain ID

# IMPORTANT: SIGNER_PRIVATE_KEY must match authorized signer in contract!
SIGNER_PRIVATE_KEY=0x<backend-signer-key>
```

### Step 3: Verify Signer Match

```bash
# Start backend
npm run dev

# Check signer matches contract
curl http://localhost:3000/nft/contract/info

# Response should show:
{
  "authorizedSigner": "0xABC...",
  "signerAddress": "0xABC...",
  "signerMatches": true  // ← Must be true!
}
```

**If `signerMatches: false`**, update contract signer:
```solidity
// Call on contract (as admin):
contract.updateSigner(backendSignerAddress);
```

---

## 📋 Contract Constants

From `ElementalSouls.sol`:

```solidity
MAX_SUPPLY = 10000
MAX_LEVEL = 10

Elements:
- 0 = Fire
- 1 = Water
- 2 = Earth
- 3 = Air

Roles:
- DEFAULT_ADMIN_ROLE: Full admin (deployer)
- ADMIN_ROLE: Can update signer
- MINTER_ROLE: Can mint NFTs
- SIGNER_ROLE: Can sign evolution permits
```

---

## 🔐 EIP-712 Signature Flow

### Contract Typehash:
```solidity
EvolvePermit(address owner,uint256 tokenId,uint8 fromLevel,uint8 toLevel,uint256 deadline,uint256 nonce,string newURI)
```

### Backend Signs:
```typescript
// In evolution.routes.ts
const permit = signerService.createPermit(
  owner,
  tokenId,
  fromLevel,
  toLevel,
  nonce,
  newURI,
  15 * 60  // 15 min validity
);

const signature = await signerService.signEvolvePermit(permit);
```

### Frontend Submits:
```typescript
const tx = await contract.evolve(permit, signature);
```

### Contract Verifies:
```solidity
bytes32 digest = _hashTypedDataV4(structHash);
address recoveredSigner = ECDSA.recover(digest, signature);
require(recoveredSigner == authorizedSigner, "Invalid signature");
```

---

## 🎯 API Workflow Examples

### Example 1: Mint NFT (Backend Gasless)

```bash
# 1. User logs in (SIWE)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Sign in to Elemental Souls...",
    "signature": "0x..."
  }'
# Returns: { "token": "eyJhbG..." }

# 2. Request mint (backend pays gas)
curl -X POST http://localhost:3000/mint/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "element": 0 }'

# Returns:
{
  "success": true,
  "txHash": "0x...",
  "metadata": {
    "element": 0,
    "level": 0,
    "metadataUri": "ipfs://...",
    "imageUrl": "https://nftstorage.link/ipfs/..."
  }
}
```

### Example 2: Evolve NFT

```bash
# 1. Check eligibility
curl -X POST http://localhost:3000/evolution/check-eligibility \
  -H "Authorization: Bearer <token>" \
  -d '{ "tokenId": 42 }'

# Returns:
{
  "eligible": true,
  "currentLevel": 2,
  "nextLevel": 3,
  "requirements": {
    "totalTasksNeeded": 7,
    "completedTasks": 10,
    "missingTasks": []
  }
}

# 2. Request evolution (generates AI image + signature)
curl -X POST http://localhost:3000/evolution/request \
  -H "Authorization: Bearer <token>" \
  -d '{ "tokenId": 42, "targetLevel": 3 }'

# Returns:
{
  "status": "ready",
  "permitSignature": {
    "permit": {
      "owner": "0x...",
      "tokenId": "42",
      "fromLevel": 2,
      "toLevel": 3,
      "deadline": "1728123456",
      "nonce": "2",
      "newURI": "ipfs://..."
    },
    "signature": "0xabcd..."
  },
  "preview": {
    "imageUrl": "https://...",
    "metadata": {...}
  }
}

# 3. Frontend calls contract.evolve(permit, signature)
# User pays gas for evolution transaction

# 4. Confirm on backend (optional, for analytics)
curl -X POST http://localhost:3000/evolution/confirm \
  -H "Authorization: Bearer <token>" \
  -d '{
    "tokenId": 42,
    "txHash": "0x..."
  }'
```

### Example 3: Get NFT Data

```bash
# Get full NFT info
curl http://localhost:3000/nft/42

# Returns:
{
  "tokenId": 42,
  "owner": "0x...",
  "element": 0,  # Fire
  "level": 3,
  "nonce": "3",
  "metadataUri": "ipfs://...",
  "metadata": {
    "name": "Fire Soul #42 - Adolescent",
    "image": "ipfs://...",
    "attributes": [...]
  },
  "stats": {
    "totalEvolutions": 3,
    "lastEvolveTime": 1728000000
  }
}
```

---

## 🧪 Testing Checklist

### Pre-Deploy Checks:
- [ ] Contract compiles without warnings
- [ ] All Foundry tests pass (`forge test`)
- [ ] Signer private key matches between contract and backend

### Post-Deploy Checks:
- [ ] Verify contract on block explorer
- [ ] Backend connects to contract (`/nft/contract/info`)
- [ ] Signer matches (`signerMatches: true`)
- [ ] Contract not paused (`paused: false`)

### Full Flow Test:
- [ ] User can login (SIWE)
- [ ] User can mint (1 per address)
- [ ] Cannot mint twice
- [ ] Tasks can be submitted
- [ ] Evolution eligibility checked
- [ ] AI generates unique image
- [ ] IPFS uploads succeed
- [ ] Evolution permit signed correctly
- [ ] Frontend can call evolve()
- [ ] NFT level increments on-chain
- [ ] Metadata URI updates
- [ ] Nonce increments (replay protection)

---

## 🔍 Debugging

### Issue: Signer Mismatch
```bash
# Check both addresses
curl http://localhost:3000/nft/contract/info

# If they don't match, update contract:
cast send $CONTRACT_ADDRESS \
  "updateSigner(address)" \
  $BACKEND_SIGNER_ADDRESS \
  --private-key $ADMIN_PRIVATE_KEY
```

### Issue: Evolution Fails "Invalid signature"
```bash
# Get domain separator from both
curl http://localhost:3000/nft/eip712/domain
cast call $CONTRACT_ADDRESS "DOMAIN_SEPARATOR()(bytes32)"

# Should match!
```

### Issue: Mint Fails "Already minted"
```bash
# Check user mint count
cast call $CONTRACT_ADDRESS \
  "userMintCount(address)(uint256)" \
  $USER_ADDRESS
```

### Issue: "Contract paused"
```bash
# Check pause state
cast call $CONTRACT_ADDRESS "paused()(bool)"

# Unpause if needed (admin only)
cast send $CONTRACT_ADDRESS "togglePause()" \
  --private-key $ADMIN_PRIVATE_KEY
```

---

## 📊 Monitoring

### Key Metrics:
```bash
# Total minted
cast call $CONTRACT_ADDRESS "_tokenIdCounter()(uint256)"

# Evolution stats for token
curl http://localhost:3000/nft/42 | jq '.stats'

# User's mint status
curl http://localhost:3000/mint/check/0xUSER_ADDRESS
```

### Event Monitoring:
```bash
# Watch Minted events
cast logs $CONTRACT_ADDRESS "Minted(address,uint256,uint8,string)"

# Watch Evolved events
cast logs $CONTRACT_ADDRESS "Evolved(address,uint256,uint8,uint8,string,uint256)"
```

---

## 🚀 Production Deployment

### Contract:
1. Deploy with multi-sig as DEFAULT_ADMIN_ROLE
2. Set backend signer with SIGNER_ROLE
3. Grant MINTER_ROLE to backend (if gasless mint)
4. Verify on block explorer

### Backend:
1. Move SIGNER_PRIVATE_KEY to AWS Secrets Manager
2. Setup monitoring (Sentry, DataDog)
3. Enable rate limiting (stricter in prod)
4. Setup Redis for caching
5. Use PostgreSQL replica for reads
6. Configure auto-scaling

### Security:
- [ ] Rotate SIGNER_PRIVATE_KEY monthly
- [ ] Monitor for unusual evolution patterns
- [ ] Set up alerts for signature failures
- [ ] Backup database regularly
- [ ] Test emergency pause procedure

---

## 📚 Additional Resources

- Contract: `/ElementalSouls/src/ElementalSouls.sol`
- Tests: `/ElementalSouls/test/ElementalSouls.t.sol`
- Full Spec: `/ELEMENTAL_SOULS_SPEC.txt`
- Backend Setup: `/Backend/SETUP_GUIDE.md`

---

**Status**: ✅ Backend fully optimized for deployed contract
**Next Step**: Deploy contract and update CONTRACT_ADDRESS in .env
