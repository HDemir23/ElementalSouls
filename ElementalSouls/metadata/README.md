# Elemental Souls - Metadata Documentation

## Overview

NFT metadata for the Elemental Souls evolving collection. Each NFT starts as a base elemental form (Level 0) and evolves through 10 levels, with unique AI-generated images at each evolution.

## Files Structure

```
metadata/
├── README.md                    # This file
├── METADATA_GUIDE.md            # Complete metadata specification
├── collection.json              # Collection-level metadata
└── templates/                   # JSON templates for each level/element
    ├── level-0-fire.json       # Fire element base
    ├── level-0-water.json      # Water element base
    ├── level-0-earth.json      # Earth element base
    ├── level-0-air.json        # Air element base
    └── level-1-fire.json       # Example evolved metadata
```

## Quick Reference

### Elements

| ID | Element | Color | Base Form |
|----|---------|-------|-----------|
| 0 | Fire | #FF4500 | Glowing Egg |
| 1 | Water | #1E90FF | Crystal Droplet |
| 2 | Earth | #8B4513 | Stone Seed |
| 3 | Air | #87CEEB | Wind Whisper |

### Evolution Levels

| Level | Stage | Rarity | Power |
|-------|-------|--------|-------|
| 0 | Base Form | Common | 10 |
| 1 | Hatchling | Uncommon | 25 |
| 2 | Sprout | Uncommon | 50 |
| 3 | Juvenile | Rare | 100 |
| 4 | Adolescent | Rare | 175 |
| 5 | Mature | Epic | 275 |
| 6 | Advanced | Epic | 400 |
| 7 | Elite | Legendary | 550 |
| 8 | Ancient | Legendary | 750 |
| 9 | Ascendant | Mythic | 1000 |
| 10 | Transcendent | Mythic | 1500 |

## Metadata Format

### Base NFTs (Level 0)
Same for all users with same element. Pre-generated images.

```json
{
  "name": "Elemental Soul #1 - Fire Egg",
  "description": "...",
  "image": "ipfs://QmXXX/fire-level-0.png",
  "background_color": "FF4500",
  "attributes": [
    {"trait_type": "Element", "value": "Fire"},
    {"trait_type": "Level", "value": 0},
    {"trait_type": "Generation", "value": "Genesis"}
  ]
}
```

### Evolved NFTs (Level 1+)
Unique for each token. AI-generated images.

```json
{
  "name": "Elemental Soul #1 - Fire Hatchling",
  "description": "...",
  "image": "ipfs://QmYYY/fire-level-1-token-1.png",
  "background_color": "FF6347",
  "attributes": [
    {"trait_type": "Element", "value": "Fire"},
    {"trait_type": "Level", "value": 1},
    {"trait_type": "Uniqueness", "value": "AI Generated"}
  ]
}
```

## Usage

### 1. Initial Mint (Backend)

```javascript
// User selects Fire element
const metadata = {
  name: `Elemental Soul #${tokenId} - Fire Egg`,
  image: "ipfs://QmBaseAssets/fire-level-0.png",
  // ... from template
};

// Upload to IPFS
const metadataURI = await uploadToIPFS(metadata);

// Mint NFT
await collection.mint(userAddress, 0, metadataURI);
```

### 2. Evolution (Backend)

```javascript
// User completes task, generates evolved image
const evolvedImage = await generateAIImage({
  element: "fire",
  level: 1,
  previousImage: currentImage
});

// Upload evolved image to IPFS
const imageCID = await uploadToIPFS(evolvedImage);

// Create evolved metadata
const evolvedMetadata = {
  name: `Elemental Soul #${tokenId} - Fire Hatchling`,
  image: `ipfs://${imageCID}/fire-level-1-token-${tokenId}.png`,
  attributes: [
    {trait_type: "Level", value: 1},
    {trait_type: "Uniqueness", value: "AI Generated"}
  ]
};

// Upload metadata
const newURI = await uploadToIPFS(evolvedMetadata);

// Create signed permit for user to claim
const permit = createPermit(tokenId, 0, 1, newURI);
const signature = await signPermit(permit);

// Return to frontend
return { permit, signature, preview: evolvedImage };
```

## IPFS Storage

### Recommended Structure

```
/elemental-souls/
  ├── collection/
  │   ├── banner.png
  │   └── collection.json
  │
  ├── base/                     # Level 0 assets (reusable)
  │   ├── fire-0.png
  │   ├── fire-0.json
  │   ├── water-0.png
  │   ├── water-0.json
  │   └── ...
  │
  └── evolved/                  # Level 1+ assets (unique)
      ├── fire-1-token-1.png
      ├── fire-1-token-1.json
      ├── water-2-token-5.png
      └── ...
```

### Pinning Services

- **Pinata:** Easy API, 1GB free
- **NFT.Storage:** Free, permanent storage
- **Web3.Storage:** Free, good for bulk uploads

## AI Image Generation

### Recommended Models

1. **Stable Diffusion XL** (via Replicate)
   - Good quality
   - Fast generation
   - Image-to-image support

2. **Midjourney** (via API)
   - Best quality
   - Slower
   - Higher cost

3. **DALL-E 3** (via OpenAI)
   - Consistent style
   - Good prompt following
   - Mid-tier cost

### Example Prompt Template

```javascript
const prompts = {
  fire: {
    0: "mystical fire egg, glowing embers, fantasy digital art",
    1: "small fire sprite hatching, cute flames, magical creature",
    2: "young fire spirit, dancing flames, growing elemental power",
    // ... up to level 10
  }
};

function generatePrompt(element, level, style = "fantasy digital art") {
  const basePrompt = prompts[element][level];
  return `${basePrompt}, ${style}, high quality, detailed, vibrant colors`;
}
```

## Contract Integration

### Get Current Metadata

```javascript
const tokenId = 1;
const uri = await collection.tokenURI(tokenId);
// uri = "ipfs://QmXXX/metadata.json"

const metadata = await fetch(ipfsToHttp(uri)).then(r => r.json());
console.log(metadata.name, metadata.attributes);
```

### Update on Evolution

```javascript
// Old NFT burns, new NFT mints with new URI
// URI automatically updated on-chain during evolution
const newTokenId = await gateway.evolve(oldTokenId, newMetadataURI);
```

## Validation

### Required Fields (ERC721)
- ✅ name
- ✅ description
- ✅ image

### OpenSea Recommended
- ✅ external_url
- ✅ background_color
- ✅ attributes (array)

### Optional Enhanced
- ⚪ animation_url (video/3D model)
- ⚪ youtube_url
- ⚪ attributes.display_type (number, boost, date)

## Testing

```bash
# Validate JSON
jq . metadata/templates/level-0-fire.json

# Check IPFS upload
curl "https://ipfs.io/ipfs/QmXXX"

# Test OpenSea rendering
# Visit: https://testnets.opensea.io/assets/monad/0x0a5C90.../1
```

## Notes

- Base images (Level 0) should be high quality, reusable
- Evolved images should maintain element theme
- Metadata immutable once on IPFS
- Use CIDv1 for better compatibility
- Pin all uploads for persistence
- Test rendering on OpenSea before launch

## Support

- Contract: `0x0a5C90D70153408Bc68dE50601581f9A0a08aB95`
- Gateway: `0x066A9C7Fe82C3B1E567C2CE6313B704B11158fDF`
- Chain: Monad Testnet (10143)
