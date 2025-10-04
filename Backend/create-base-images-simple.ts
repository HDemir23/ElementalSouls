import Replicate from 'replicate';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const replicateToken = process.env.REPLICATE_API_TOKEN;

if (!replicateToken) {
  throw new Error('Missing REPLICATE_API_TOKEN environment variable');
}

const replicate = new Replicate({
  auth: replicateToken,
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

async function downloadImage(imageUrl: string, filename: string): Promise<string> {
  console.log(`   📥 Downloading image...`);

  // Create images directory if it doesn't exist
  const imagesDir = path.join(process.cwd(), 'generated-images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data);

  const filepath = path.join(imagesDir, filename);
  fs.writeFileSync(filepath, imageBuffer);

  const sizeKB = (imageBuffer.length / 1024).toFixed(2);
  console.log(`   💾 Saved: ${filepath} (${sizeKB} KB)`);

  return filepath;
}

async function main() {
  console.log('🔥 Elemental Souls - Base Image Generator\n');
  console.log('==========================================\n');

  const results: Array<{
    element: string;
    emoji: string;
    imageUrl: string;
    localPath: string;
  }> = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    console.log(`${element.emoji} Creating ${element.name} Soul (Element ${i})...\n`);

    try {
      // Generate unique seed for each element
      const seed = 1000 + i;

      // Generate image
      const imageUrl = await generateImage(element.prompt, seed);

      // Download locally
      const filename = `element_${i}_${element.name.toLowerCase()}_level_0.png`;
      const localPath = await downloadImage(imageUrl, filename);

      results.push({
        element: element.name,
        emoji: element.emoji,
        imageUrl,
        localPath,
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
    console.log(`   Replicate URL: ${result.imageUrl}`);
    console.log(`   Local Path: ${result.localPath}`);
    console.log('');
  });

  console.log('📁 All images saved in: ./generated-images/\n');
  console.log('💡 Next Steps:');
  console.log('1. View images locally in ./generated-images/ folder');
  console.log('2. Images will be auto-uploaded to IPFS when you mint NFTs');
  console.log('3. Run: npm run dev (start backend)');
  console.log('4. Run: ./test-evolution-flow.sh (test full flow)\n');

  // Save results to JSON
  const resultsFile = path.join(process.cwd(), 'generated-images', 'results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`📄 Results saved to: ${resultsFile}\n`);
}

main().catch(console.error);
