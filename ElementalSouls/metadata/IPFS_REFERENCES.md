# IPFS References - Elemental Souls

## Base Images (Level 0)

| Element | IPFS CID | IPFS URL | HTTP Gateway |
|---------|----------|----------|--------------|
| **Water** (1) | `bafybeigwa4ee3rddizv2unijvwcbln7ygvtubl3brnuol3ijmutnujx7zm` | ipfs://bafybeigwa4ee3rddizv2unijvwcbln7ygvtubl3brnuol3ijmutnujx7zm | https://ipfs.io/ipfs/bafybeigwa4ee3rddizv2unijvwcbln7ygvtubl3brnuol3ijmutnujx7zm |
| **Fire** (0) | `bafybeigbcyli4bo6g2b6c3bwirpul5nobhiailfox2lkiepfzstaqrktfe` | ipfs://bafybeigbcyli4bo6g2b6c3bwirpul5nobhiailfox2lkiepfzstaqrktfe | https://ipfs.io/ipfs/bafybeigbcyli4bo6g2b6c3bwirpul5nobhiailfox2lkiepfzstaqrktfe |
| **Earth** (2) | `bafybeia3bwsbtdyaarklxejnp5jvx2kbthokfhdzwcquerrjysgg6zxq7a` | ipfs://bafybeia3bwsbtdyaarklxejnp5jvx2kbthokfhdzwcquerrjysgg6zxq7a | https://ipfs.io/ipfs/bafybeia3bwsbtdyaarklxejnp5jvx2kbthokfhdzwcquerrjysgg6zxq7a |
| **Air** (3) | `bafybeidoluxp77kb75awwbvq5yt2xtpnorrn6rfbnbu64hqwep64xbfady` | ipfs://bafybeidoluxp77kb75awwbvq5yt2xtpnorrn6rfbnbu64hqwep64xbfady | https://ipfs.io/ipfs/bafybeidoluxp77kb75awwbvq5yt2xtpnorrn6rfbnbu64hqwep64xbfady |

## Base Metadata URLs (To be uploaded)

After uploading metadata JSON files to IPFS, update these:

| Element | Metadata CID | Metadata URL |
|---------|--------------|--------------|
| Water | TBD | ipfs://QmXXX/water-level-0.json |
| Fire | TBD | ipfs://QmXXX/fire-level-0.json |
| Earth | TBD | ipfs://QmXXX/earth-level-0.json |
| Air | TBD | ipfs://QmXXX/air-level-0.json |

## Backend Integration

### JavaScript/TypeScript Constants

```typescript
// IPFS CIDs for base images
export const BASE_IMAGES = {
  WATER: 'bafybeigwa4ee3rddizv2unijvwcbln7ygvtubl3brnuol3ijmutnujx7zm',
  FIRE: 'bafybeigbcyli4bo6g2b6c3bwirpul5nobhiailfox2lkiepfzstaqrktfe',
  EARTH: 'bafybeia3bwsbtdyaarklxejnp5jvx2kbthokfhdzwcquerrjysgg6zxq7a',
  AIR: 'bafybeidoluxp77kb75awwbvq5yt2xtpnorrn6rfbnbu64hqwep64xbfady'
};

// Element ID to image CID mapping
export const ELEMENT_TO_IMAGE: Record<number, string> = {
  0: BASE_IMAGES.FIRE,   // Fire
  1: BASE_IMAGES.WATER,  // Water
  2: BASE_IMAGES.EARTH,  // Earth
  3: BASE_IMAGES.AIR     // Air
};

// Element names
export const ELEMENT_NAMES = ['Fire', 'Water', 'Earth', 'Air'];

// Element colors
export const ELEMENT_COLORS = ['FF4500', '1E90FF', '8B4513', '87CEEB'];

// Element stages (Level 0)
export const ELEMENT_STAGES = ['Egg', 'Droplet', 'Seed', 'Whisper'];
```

### Generate Base Metadata Function

```typescript
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  background_color: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
    max_value?: number;
  }>;
}

function generateBaseMetadata(tokenId: number, element: number): NFTMetadata {
  const elementName = ELEMENT_NAMES[element];
  const stage = ELEMENT_STAGES[element];
  const imageCID = ELEMENT_TO_IMAGE[element];
  const bgColor = ELEMENT_COLORS[element];

  const descriptions = {
    0: "A nascent fire soul, pulsing with inner heat. This elemental egg awaits its first awakening. Complete tasks to help it evolve into its next form.",
    1: "A pristine water droplet, shimmering with potential. This elemental essence awaits its awakening. Complete tasks to help it flow into its next form.",
    2: "An ancient stone seed, covered in moss and etched with runes. This grounded essence waits to sprout. Complete tasks to help it grow into its next form.",
    3: "A swirling vortex of ethereal wind, barely visible. This airy essence floats in anticipation. Complete tasks to help it breeze into its next form."
  };

  return {
    name: `Elemental Soul #${tokenId} - ${elementName} ${stage}`,
    description: descriptions[element],
    image: `ipfs://${imageCID}`,
    external_url: `https://elementalsouls.xyz/soul/${tokenId}`,
    background_color: bgColor,
    attributes: [
      {
        trait_type: "Element",
        value: elementName
      },
      {
        trait_type: "Level",
        value: 0,
        display_type: "number",
        max_value: 10
      },
      {
        trait_type: "Stage",
        value: stage
      },
      {
        trait_type: "Rarity",
        value: "Common"
      },
      {
        trait_type: "Power",
        value: 10,
        display_type: "boost_number"
      },
      {
        trait_type: "Generation",
        value: "Genesis"
      }
    ]
  };
}
```

### Usage Example

```typescript
// When user mints a Fire NFT (element 0)
const tokenId = 1;
const element = 0; // Fire

// Generate metadata
const metadata = generateBaseMetadata(tokenId, element);

// Upload to IPFS (using Pinata, NFT.Storage, etc.)
const metadataURI = await uploadToIPFS(metadata);

// Mint NFT on-chain
await collection.mint(userAddress, element, metadataURI);
```

### Pinata Upload Example

```typescript
import axios from 'axios';

async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    metadata,
    {
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey
      }
    }
  );

  return `ipfs://${response.data.IpfsHash}`;
}
```

### NFT.Storage Upload Example

```typescript
import { NFTStorage, File } from 'nft.storage';

async function uploadMetadataToNFTStorage(metadata: NFTMetadata): Promise<string> {
  const client = new NFTStorage({ token: process.env.NFT_STORAGE_KEY });

  const metadataJSON = JSON.stringify(metadata);
  const metadataFile = new File([metadataJSON], 'metadata.json', {
    type: 'application/json'
  });

  const cid = await client.storeBlob(metadataFile);
  return `ipfs://${cid}`;
}
```

## Testing URLs

### View Images in Browser

- Water: https://ipfs.io/ipfs/bafybeigwa4ee3rddizv2unijvwcbln7ygvtubl3brnuol3ijmutnujx7zm
- Fire: https://ipfs.io/ipfs/bafybeigbcyli4bo6g2b6c3bwirpul5nobhiailfox2lkiepfzstaqrktfe
- Earth: https://ipfs.io/ipfs/bafybeia3bwsbtdyaarklxejnp5jvx2kbthokfhdzwcquerrjysgg6zxq7a
- Air: https://ipfs.io/ipfs/bafybeidoluxp77kb75awwbvq5yt2xtpnorrn6rfbnbu64hqwep64xbfady

### Alternative Gateways

```
https://gateway.pinata.cloud/ipfs/{CID}
https://cloudflare-ipfs.com/ipfs/{CID}
https://dweb.link/ipfs/{CID}
```

## Next Steps

1. ✅ Base images uploaded to IPFS
2. ⬜ Upload metadata JSON files
3. ⬜ Test one complete mint flow
4. ⬜ Verify OpenSea rendering
5. ⬜ Set up AI generation for evolved forms

## Notes

- All base images are permanent on IPFS
- Metadata will be uploaded per mint
- Use consistent gateway for best performance
- Pin all uploads to prevent garbage collection
