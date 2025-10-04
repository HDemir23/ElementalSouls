import axios from 'axios';

const API_KEY = process.env.NFT_STORAGE_API_KEY || ''; // Replace with your API key or load from .env
const BASE_URL = 'https://api.nft.storage';

async function testUpload() {
  try {
    console.log('🧪 Testing NFT.Storage API upload...\n');

    // Test image URL from Replicate
    const imageUrl = 'https://replicate.delivery/xezq/gLEVNhMyibJQElBwUHQPcQzV0PwKktnMF8iediwex3IJDrbVA/out-0.png';

    console.log('📥 Downloading image...');
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    console.log(`✅ Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

    console.log('📤 Uploading to NFT.Storage...');
    console.log(`   URL: ${BASE_URL}/upload`);
    console.log(`   API Key: ${API_KEY.substring(0, 10)}...`);
    console.log(`   Content-Type: image/png\n`);

    const uploadResponse = await axios.post(`${BASE_URL}/upload`, imageBuffer, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'image/png',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log('✅ Upload successful!');
    console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));

    const cid = uploadResponse.data.value.cid;
    console.log(`\n🔗 IPFS URL: ipfs://${cid}`);
    console.log(`🌐 Gateway: https://nftstorage.link/ipfs/${cid}`);

  } catch (error) {
    console.error('\n❌ Upload failed!');

    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

testUpload();
