import Replicate from 'replicate';
import { NFTStorage, Blob } from 'nft.storage';
import axios from 'axios';

const replicateToken = process.env.REPLICATE_API_TOKEN;
const nftStorageToken = process.env.NFT_STORAGE_API_KEY;

if (!replicateToken) {
  throw new Error('Missing REPLICATE_API_TOKEN environment variable');
}

if (!nftStorageToken) {
  throw new Error('Missing NFT_STORAGE_API_KEY environment variable');
}

const replicate = new Replicate({
  auth: replicateToken,
});

const nftStorage = new NFTStorage({
  token: nftStorageToken,
});

interface ElementConfig {
  name: string;
  emoji: string;
  prompt: string;
}

const elements: ElementConfig[] = [
  {
    name: 'Fire',
    emoji: '🔥',
    prompt: 'A mystical fire elemental soul egg, glowing with intense flames and ember particles, floating in a dark ethereal space, magical aura, fantasy art style, highly detailed, 8k quality, vibrant orange and red colors',
  },
  {
    name: 'Water',
    emoji: '💧',
    prompt: 'A mystical water elemental soul egg, flowing with liquid energy and water droplets, floating in a dark ethereal space, magical aura, fantasy art style, highly detailed, 8k quality, vibrant blue and cyan colors',
  },
  {
    name: 'Earth',
    emoji: '🌍',
    prompt: 'A mystical earth elemental soul egg, covered with rocks, crystals and moss, floating in a dark ethereal space, magical aura, fantasy art style, highly detailed, 8k quality, vibrant green and brown colors',
  },
  {
    name: 'Air',
    emoji: '💨',
    prompt: 'A mystical air elemental soul egg, swirling with wind currents and cloud wisps, floating in a dark ethereal space, magical aura, fantasy art style, highly detailed, 8k quality, vibrant white and silver colors',
  },
];

async function generateImage(prompt: string, seed: number): Promise<string> {
  console.log(`   🎨 Generating with Replicate...`);

  const output = await replicate.run(
    'black-forest-labs/flux-schnell' as `${string}/${string}`,
    {
      input: {
        prompt,
        aspect_ratio: '1:1',
        output_format: 'png',
        num_outputs: 1,
        seed,
      },
    }
  );

  const imageUrl = Array.isArray(output) ? output[0] : output;
  console.log(`   ✅ Image generated: ${imageUrl}`);
  return imageUrl as string;
}

async function uploadToIPFS(imageUrl: string, filename: string): Promise<string> {
  console.log(`   📤 Downloading image...`);
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data);

  console.log(`   📤 Uploading to IPFS (${(imageBuffer.length / 1024).toFixed(2)} KB)...`);
  const blob = new Blob([imageBuffer]);
  const cid = await nftStorage.storeBlob(blob);

  const ipfsUrl = `ipfs://${cid}`;
  const gatewayUrl = `https://nftstorage.link/ipfs/${cid}`;

  console.log(`   ✅ Uploaded to IPFS: ${ipfsUrl}`);
  console.log(`   🌐 Gateway URL: ${gatewayUrl}`);

  return ipfsUrl;
}

async function main() {
  console.log('🔥 Elemental Souls - Base Image Generator\n');
  console.log('==========================================\n');

  const results: Array<{
    element: string;
    emoji: string;
    imageUrl: string;
    ipfsUri: string;
    gatewayUrl: string;
  }> = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    console.log(`${element.emoji} Creating ${element.name} Soul (Element ${i})...\n`);

    try {
      // Generate unique seed for each element
      const seed = 1000 + i;

      // Generate image
      const imageUrl = await generateImage(element.prompt, seed);

      // Upload to IPFS
      const ipfsUri = await uploadToIPFS(imageUrl, `${element.name.toLowerCase()}_soul_level_0.png`);
      const cid = ipfsUri.replace('ipfs://', '');
      const gatewayUrl = `https://nftstorage.link/ipfs/${cid}`;

      results.push({
        element: element.name,
        emoji: element.emoji,
        imageUrl,
        ipfsUri,
        gatewayUrl,
      });

      console.log(`   ✅ ${element.name} Soul complete!\n`);
    } catch (error) {
      console.error(`   ❌ Failed to create ${element.name} Soul:`, error);
    }

    // Wait 2 seconds between generations to avoid rate limiting
    if (i < elements.length - 1) {
      console.log('   ⏳ Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n==========================================');
  console.log('✅ All Base Images Created!\n');
  console.log('==========================================\n');

  console.log('📊 Summary:\n');
  results.forEach((result, i) => {
    console.log(`${result.emoji} ${result.element} Soul (Element ${i}):`);
    console.log(`   IPFS URI: ${result.ipfsUri}`);
    console.log(`   Gateway: ${result.gatewayUrl}`);
    console.log('');
  });

  console.log('💡 Next Steps:');
  console.log('1. View images in browser using Gateway URLs');
  console.log('2. Run: npm run dev (start backend)');
  console.log('3. Run: ./test-evolution-flow.sh (test full flow)\n');
}

main().catch(console.error);
