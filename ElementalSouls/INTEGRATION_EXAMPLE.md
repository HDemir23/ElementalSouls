# Backend & Frontend Integration Example

## Contract Addresses

```javascript
const COLLECTION_ADDRESS = "0x0a5C90D70153408Bc68dE50601581f9A0a08aB95";
const GATEWAY_ADDRESS = "0x066A9C7Fe82C3B1E567C2CE6313B704B11158fDF";
const MONAD_RPC = "https://testnet-rpc.monad.xyz";
const CHAIN_ID = 10143;
```

## Backend: Sign Permit (Node.js + ethers.js)

```javascript
const { ethers } = require("ethers");

// Backend signer wallet
const provider = new ethers.JsonRpcProvider(MONAD_RPC);
const signerWallet = new ethers.Wallet(process.env.BACKEND_SIGNER_KEY, provider);

// EIP-712 Domain
const domain = {
    name: "LevelUpGateway",
    version: "1",
    chainId: CHAIN_ID,
    verifyingContract: GATEWAY_ADDRESS
};

// EIP-712 Types
const types = {
    LevelUpPermit: [
        { name: "owner", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "fromLevel", type: "uint8" },
        { name: "toLevel", type: "uint8" },
        { name: "deadline", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "newUri", type: "string" }
    ]
};

// Sign function
async function signLevelUpPermit(permit) {
    const signature = await signerWallet.signTypedData(domain, types, permit);
    return signature;
}

// API endpoint
app.post("/api/level-up/prepare", async (req, res) => {
    const { userAddress, tokenId } = req.body;

    try {
        // 1. Verify task completion
        const taskCompleted = await checkUserTaskCompletion(userAddress);
        if (!taskCompleted) {
            return res.status(403).json({ error: "Task not completed" });
        }

        // 2. Get current NFT state
        const collection = new ethers.Contract(COLLECTION_ADDRESS, COLLECTION_ABI, provider);
        const gateway = new ethers.Contract(GATEWAY_ADDRESS, GATEWAY_ABI, provider);

        const owner = await collection.ownerOf(tokenId);
        const currentLevel = await collection.levelOf(tokenId);
        const nonce = await gateway.getNonce(tokenId);

        // Verify ownership
        if (owner.toLowerCase() !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: "Not the owner" });
        }

        // 3. Generate evolved image with AI
        const currentUri = await collection.tokenURI(tokenId);
        const currentImageUrl = ipfsToHttp(currentUri); // Convert ipfs:// to https://

        const evolvedImage = await generateEvolvedImage({
            currentImage: currentImageUrl,
            currentLevel: currentLevel,
            nextLevel: currentLevel + 1
        });

        // 4. Upload to IPFS
        const metadata = {
            name: `Elemental Soul #${tokenId} - Level ${currentLevel + 1}`,
            description: `An evolved elemental soul at level ${currentLevel + 1}`,
            image: evolvedImage.ipfsUrl,
            attributes: [
                { trait_type: "Level", value: currentLevel + 1 },
                { trait_type: "Evolution", value: nonce + 1 }
            ]
        };

        const metadataUri = await uploadToIPFS(metadata);

        // 5. Create permit
        const permit = {
            owner: userAddress,
            tokenId: Number(tokenId),
            fromLevel: currentLevel,
            toLevel: currentLevel + 1,
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            nonce: Number(nonce),
            newUri: metadataUri
        };

        // 6. Sign permit
        const signature = await signLevelUpPermit(permit);

        // 7. Return to frontend
        res.json({
            success: true,
            permit,
            signature,
            preview: {
                currentLevel: currentLevel,
                nextLevel: currentLevel + 1,
                imageUrl: evolvedImage.httpUrl,
                expiresAt: new Date(permit.deadline * 1000).toISOString()
            }
        });

    } catch (error) {
        console.error("Level up preparation failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// Helper: IPFS to HTTP
function ipfsToHttp(ipfsUrl) {
    return ipfsUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
}

// Helper: AI image generation (example with Replicate)
async function generateEvolvedImage({ currentImage, currentLevel, nextLevel }) {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

    const output = await replicate.run(
        "stability-ai/sdxl:...",
        {
            input: {
                image: currentImage,
                prompt: `evolved elemental creature, level ${nextLevel}, more powerful, fantasy art`,
                strength: 0.5
            }
        }
    );

    // Upload to IPFS
    const ipfsCid = await uploadImageToIPFS(output[0]);

    return {
        ipfsUrl: `ipfs://${ipfsCid}`,
        httpUrl: `https://ipfs.io/ipfs/${ipfsCid}`
    };
}

// Helper: Upload to IPFS (using Pinata)
async function uploadToIPFS(data) {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.PINATA_JWT}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
}
```

## Frontend: Execute Level Up (React + ethers.js)

```typescript
import { ethers } from "ethers";
import { useState } from "react";

const COLLECTION_ABI = [...]; // From ElementalSouls.abi.json
const GATEWAY_ABI = [...]; // From LevelUpGateway.abi.json

function LevelUpButton({ tokenId }) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    // Step 1: Get signed permit from backend
    const prepareLevelUp = async () => {
        setLoading(true);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            // Call backend API
            const response = await fetch("/api/level-up/prepare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userAddress, tokenId })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            setPreview(data.preview);
            return data;

        } catch (error) {
            console.error("Preparation failed:", error);
            alert(error.message);
            setLoading(false);
            return null;
        }
    };

    // Step 2: Execute on-chain level up
    const executeLevelUp = async (permitData) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const collection = new ethers.Contract(COLLECTION_ADDRESS, COLLECTION_ABI, signer);

            // Encode permit + signature
            const data = ethers.AbiCoder.defaultAbiCoder().encode(
                ["tuple(address,uint256,uint8,uint8,uint256,uint256,string)", "bytes"],
                [
                    [
                        permitData.permit.owner,
                        permitData.permit.tokenId,
                        permitData.permit.fromLevel,
                        permitData.permit.toLevel,
                        permitData.permit.deadline,
                        permitData.permit.nonce,
                        permitData.permit.newUri
                    ],
                    permitData.signature
                ]
            );

            // Execute safeTransferFrom
            const tx = await collection["safeTransferFrom(address,address,uint256,bytes)"](
                await signer.getAddress(),
                GATEWAY_ADDRESS,
                tokenId,
                data
            );

            console.log("Transaction sent:", tx.hash);

            const receipt = await tx.wait();
            console.log("Level up successful!", receipt);

            // Parse events to get new token ID
            const gateway = new ethers.Contract(GATEWAY_ADDRESS, GATEWAY_ABI, provider);
            const leveledUpEvent = receipt.logs
                .map(log => {
                    try { return gateway.interface.parseLog(log); }
                    catch { return null; }
                })
                .find(e => e && e.name === "LeveledUp");

            if (leveledUpEvent) {
                const newTokenId = leveledUpEvent.args.newId;
                alert(`Success! New NFT #${newTokenId} minted at level ${permitData.preview.nextLevel}`);
            }

            setLoading(false);

        } catch (error) {
            console.error("Transaction failed:", error);
            alert("Transaction failed: " + error.message);
            setLoading(false);
        }
    };

    // Combined flow
    const handleLevelUp = async () => {
        const permitData = await prepareLevelUp();
        if (permitData) {
            await executeLevelUp(permitData);
        }
    };

    return (
        <div>
            <button onClick={handleLevelUp} disabled={loading}>
                {loading ? "Processing..." : "Level Up!"}
            </button>

            {preview && (
                <div className="preview">
                    <h3>Evolution Preview</h3>
                    <img src={preview.imageUrl} alt="Evolved form" />
                    <p>Level {preview.currentLevel} → {preview.nextLevel}</p>
                    <p>Expires: {new Date(preview.expiresAt).toLocaleString()}</p>
                </div>
            )}
        </div>
    );
}

export default LevelUpButton;
```

## Testing the Flow

### 1. Mint Initial NFT (Backend/Admin)

```javascript
const collection = new ethers.Contract(COLLECTION_ADDRESS, COLLECTION_ABI, adminWallet);

const tx = await collection.mint(
    userAddress,
    0, // level 0
    "ipfs://Qm.../level-0-metadata.json"
);

const receipt = await tx.wait();
console.log("Minted token ID:", receipt.logs[0].topics[3]);
```

### 2. User Completes Task

(Your app logic - database update, etc.)

### 3. User Clicks "Level Up"

Frontend calls backend → gets signed permit → executes transaction

### 4. Verify Result

```javascript
const newTokenId = 2; // From event
const owner = await collection.ownerOf(newTokenId);
const level = await collection.levelOf(newTokenId);
const uri = await collection.tokenURI(newTokenId);

console.log({
    owner,  // user address
    level,  // 1
    uri     // ipfs://... new metadata
});
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "wrong collection" | Wrong NFT contract | Check collection address |
| "owner mismatch" | Permit owner ≠ sender | Re-generate permit |
| "expired" | Deadline passed | Get new permit |
| "bad nonce" | Nonce mismatch | Fetch current nonce |
| "bad level" | Level jump > 1 | Check fromLevel/toLevel |
| "state drift" | On-chain level ≠ permit | Re-fetch current state |
| "bad signer" | Invalid signature | Check backend signer key |

### Frontend Error Display

```typescript
try {
    await executeLevelUp(permitData);
} catch (error) {
    if (error.message.includes("expired")) {
        alert("Permit expired. Please try again.");
    } else if (error.message.includes("owner mismatch")) {
        alert("You are not the owner of this NFT.");
    } else {
        alert("Transaction failed: " + error.message);
    }
}
```

## Security Checklist

- [ ] Backend signer private key in secure env variable
- [ ] Rate limiting on `/api/level-up/prepare` endpoint
- [ ] Task completion verification before signing
- [ ] HTTPS only for API endpoints
- [ ] CORS properly configured
- [ ] Reasonable deadline (1 hour recommended)
- [ ] Log all permit signings for audit
- [ ] Monitor for suspicious patterns

## Next Steps

1. Deploy backend API
2. Set up IPFS storage (Pinata/NFT.Storage)
3. Integrate AI image generation
4. Build frontend UI
5. Test end-to-end flow
6. Add monitoring & analytics
