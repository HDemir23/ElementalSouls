# Elemental Souls NFT - Deployment & Backend Integration Guide

## Contract Deployment Information

**Contract Address:** `0xEb44E4b7a35E41eFFDe3d8D656D076cE4e4cD5d3`
**Network:** Monad Testnet
**Chain ID:** 10143
**RPC URL:** `https://testnet-rpc.monad.xyz`
**Deployer Address:** `0xE9fE9341a4193732BC34B37ed58A1EB4144f717B`

## Contract Overview

ElementalSouls is an ERC721 NFT contract with evolution mechanics:
- Users mint a base NFT (Level 0) with one of 4 elements
- Users can evolve their NFT by burning the old one and receiving a new one with higher level
- Each evolution creates a unique NFT with new metadata/image

## Element Types

```solidity
enum Element { Fire, Water, Earth, Air }
```

- 0 = Fire (Ateş)
- 1 = Water (Su)
- 2 = Earth (Toprak)
- 3 = Air (Hava)

## Key Functions for Backend Integration

### 1. Mint Base NFT (Level 0)
```solidity
function mintBase(address to, Element element, string calldata uri)
    external
    returns (uint256)
```

**Parameters:**
- `to`: User's wallet address
- `element`: 0, 1, 2, or 3 (Fire, Water, Earth, Air)
- `uri`: IPFS URL or metadata URI for the NFT image

**Access:** Only `MINTER_ROLE` (deployer has this role)

**Usage:**
- Backend calls this when user selects their base element
- User can only mint ONE base NFT per address
- Returns the newly minted token ID

---

### 2. Evolve NFT
```solidity
function evolve(uint256 oldTokenId, string calldata newUri)
    external
    returns (uint256)
```

**Parameters:**
- `oldTokenId`: The current NFT token ID to burn
- `newUri`: New IPFS URL or metadata URI for the evolved NFT

**Access:** Public - any NFT owner can call

**Usage:**
- User calls this directly from frontend after completing tasks
- Backend generates new image using AI, uploads to IPFS
- User's transaction burns old NFT and mints new one with level+1
- Returns the new token ID

---

### 3. Get NFT Details
```solidity
function getSoul(uint256 tokenId)
    external
    view
    returns (
        Element element,
        uint8 level,
        string memory uri,
        uint256 mintedAt
    )
```

**Returns:**
- `element`: The element type (0-3)
- `level`: Current level (0-10)
- `uri`: Metadata URI
- `mintedAt`: Timestamp when minted

---

### 4. Get User's NFTs
```solidity
function tokensOfOwner(address owner)
    external
    view
    returns (uint256[] memory)
```

**Returns:** Array of token IDs owned by the address

**Usage:** Backend can query this to see all NFTs owned by a user

---

### 5. Get Token URI
```solidity
function tokenURI(uint256 tokenId)
    public
    view
    returns (string memory)
```

**Returns:** Metadata URI for the NFT

---

## Backend Workflow

### Initial Mint (User selects element)

1. User connects wallet and selects element (0-3)
2. Backend checks if user already minted: `userMintCount[userAddress]`
3. Backend prepares base image for selected element (Level 0)
4. Backend uploads image + metadata to IPFS
5. Backend calls `mintBase(userAddress, element, ipfsUri)` with admin wallet
6. Return token ID to user

### Evolution (User completes task)

1. User completes task in your app
2. Backend verifies task completion
3. Backend gets user's current NFT: `tokensOfOwner(userAddress)`
4. Backend gets NFT details: `getSoul(tokenId)`
5. Backend generates new evolved image using AI (based on element + new level)
6. Backend uploads new image to IPFS
7. **Frontend** calls `evolve(oldTokenId, newIpfsUri)` from user's wallet
8. Old NFT is burned, new NFT is minted with level+1

### Querying User's NFT

```javascript
// Get user's NFTs
const tokenIds = await contract.tokensOfOwner(userAddress);

// Get details for each NFT
for (const tokenId of tokenIds) {
    const soul = await contract.getSoul(tokenId);
    console.log({
        element: soul.element, // 0-3
        level: soul.level,     // 0-10
        uri: soul.uri,         // IPFS URL
        mintedAt: soul.mintedAt
    });
}
```

## ABI Generation

Generate ABI for backend:
```bash
cd /Users/rose/Desktop/MonadHackhathon/ElementalSouls
forge build
cat out/ElementalSouls.sol/ElementalSouls.json | jq .abi > ElementalSouls.abi.json
```

## Environment Variables for Backend

```env
CONTRACT_ADDRESS=0xEb44E4b7a35E41eFFDe3d8D656D076cE4e4cD5d3
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=10143
ADMIN_PRIVATE_KEY=<your-admin-private-key>
ADMIN_ADDRESS=0xE9fE9341a4193732BC34B37ed58A1EB4144f717B
```

## Events to Listen

### SoulMinted
```solidity
event SoulMinted(
    address indexed owner,
    uint256 indexed tokenId,
    Element element,
    uint8 level,
    string uri
)
```

### SoulEvolved
```solidity
event SoulEvolved(
    address indexed owner,
    uint256 indexed oldTokenId,
    uint256 indexed newTokenId,
    uint8 fromLevel,
    uint8 toLevel,
    string newUri
)
```

### SoulBurned
```solidity
event SoulBurned(
    address indexed owner,
    uint256 indexed tokenId,
    uint8 level
)
```

## Sample Integration Code (ethers.js)

```javascript
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

const contractABI = require('./ElementalSouls.abi.json');
const contractAddress = '0xEb44E4b7a35E41eFFDe3d8D656D076cE4e4cD5d3';

const contract = new ethers.Contract(contractAddress, contractABI, adminWallet);

// Mint base NFT for user
async function mintBaseNFT(userAddress, element, ipfsUri) {
    const tx = await contract.mintBase(userAddress, element, ipfsUri);
    const receipt = await tx.wait();

    // Get token ID from event
    const event = receipt.logs.find(log => {
        try {
            return contract.interface.parseLog(log).name === 'SoulMinted';
        } catch(e) { return false; }
    });

    const tokenId = contract.interface.parseLog(event).args.tokenId;
    return tokenId;
}

// User evolves (called from frontend with user's wallet)
async function evolveNFT(userWallet, oldTokenId, newIpfsUri) {
    const userContract = contract.connect(userWallet);
    const tx = await userContract.evolve(oldTokenId, newIpfsUri);
    const receipt = await tx.wait();
    return receipt;
}

// Get user's NFTs
async function getUserNFTs(userAddress) {
    const tokenIds = await contract.tokensOfOwner(userAddress);

    const nfts = [];
    for (const tokenId of tokenIds) {
        const soul = await contract.getSoul(tokenId);
        nfts.push({
            tokenId: tokenId.toString(),
            element: soul.element,
            level: soul.level,
            uri: soul.uri,
            mintedAt: new Date(Number(soul.mintedAt) * 1000)
        });
    }

    return nfts;
}
```

## Storage Structure for Base Images

Suggested folder structure for base NFT images:

```
/storage/base-images/
  ├── fire-level-0.png
  ├── water-level-0.png
  ├── earth-level-0.png
  └── air-level-0.png

/storage/metadata/
  ├── fire-level-0.json
  ├── water-level-0.json
  ├── earth-level-0.json
  └── air-level-0.json
```

## Metadata Format (ERC721)

```json
{
  "name": "Elemental Soul #123 - Fire Level 0",
  "description": "A Fire elemental soul at the beginning of its journey",
  "image": "ipfs://QmXXXXXX/fire-level-0.png",
  "attributes": [
    {
      "trait_type": "Element",
      "value": "Fire"
    },
    {
      "trait_type": "Level",
      "value": 0
    },
    {
      "trait_type": "Generation",
      "value": "Genesis"
    }
  ]
}
```

## Testing on Monad Testnet

1. Get testnet tokens from Monad faucet
2. Use the deployed contract address
3. Call functions using ethers.js or web3.js
4. Monitor events on Monad explorer

## Important Notes

- Each user can only mint **ONE** base NFT (Level 0)
- Evolution burns the old NFT and creates a new one
- Max level is 10
- The deployer address has ADMIN and MINTER roles
- NFTs are fully transferable (not soulbound)
- Backend needs to manage AI image generation and IPFS uploads
- Users pay gas for evolution transactions (not minting)

## Next Steps

1. Generate contract ABI: `forge build && cat out/ElementalSouls.sol/ElementalSouls.json | jq .abi > ElementalSouls.abi.json`
2. Set up IPFS storage (Pinata, NFT.Storage, etc.)
3. Create base images for 4 elements (Level 0)
4. Integrate AI image-to-image model for evolution
5. Build frontend UI for wallet connection and evolution
6. Implement task completion verification in backend
