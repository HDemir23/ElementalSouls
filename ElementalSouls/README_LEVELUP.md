# Elemental Souls - Level Up System

Atomik NFT evolution sistemi: Kullanıcı eski NFT'sini gateway'e gönderir, tek transaction'da burn + yeni level ile mint edilir.

## 📋 Contract Mimarisi

### ElementalSouls (ERC721 Collection)
- **Adres:** TBD (deploy sonrası)
- **İsim/Sembol:** "ElementalSouls" / "ELS"
- **Özellikler:**
  - Transferable (soulbound değil)
  - Burnable (sadece gateway tarafından)
  - Level tracking per token
  - Custom metadata URIs

### LevelUpGateway (IERC721Receiver + EIP712)
- **Adres:** TBD (deploy sonrası)
- **Görev:** Atomik burn + mint işlemleri
- **Güvenlik:** EIP-712 signed permits, nonce, deadline, processing locks

## 🔄 Nasıl Çalışır?

### Akış

```
User                    Gateway                  Collection
  |                         |                         |
  |  1. safeTransferFrom    |                         |
  |  (with permit+sig)      |                         |
  |------------------------>|                         |
  |                         |                         |
  |                         |  2. Verify permit       |
  |                         |     - Owner check       |
  |                         |     - Deadline check    |
  |                         |     - Nonce check       |
  |                         |     - Level check       |
  |                         |     - Signature verify  |
  |                         |                         |
  |                         |  3. burn(oldTokenId)    |
  |                         |------------------------>|
  |                         |                         |
  |                         |  4. mint(user, newLvl)  |
  |                         |<------------------------|
  |                         |                         |
  |  5. New NFT in wallet   |                         |
  |<--------------------------------------------------|
```

### Frontend İşlem Örneği

```javascript
// 1. Backend'den signed permit al
const permit = {
    owner: userAddress,
    tokenId: 1,
    fromLevel: 0,
    toLevel: 1,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    nonce: 0,
    newUri: "ipfs://Qm...evolved-image"
};

const signature = await backend.signPermit(permit);

// 2. Encode data
const data = ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address,uint256,uint8,uint8,uint256,uint256,string)", "bytes"],
    [
        [permit.owner, permit.tokenId, permit.fromLevel, permit.toLevel,
         permit.deadline, permit.nonce, permit.newUri],
        signature
    ]
);

// 3. Kullanıcı tek transaction yapar
await nftContract.safeTransferFrom(
    userAddress,
    gatewayAddress,
    tokenId,
    data
);

// ✅ Tek tx'de: old token burned + new token minted
```

## 🚀 Deployment

### 1. Contracts Deploy Et

```bash
# Build
forge build

# Deploy ElementalSouls
forge create src/ElementalSouls.sol:ElementalSouls \
    --rpc-url $MONAD_RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

# Deploy LevelUpGateway
forge create src/LevelUpGateway.sol:LevelUpGateway \
    --rpc-url $MONAD_RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args <COLLECTION_ADDRESS> <SIGNER_ADDRESS> \
    --legacy
```

### 2. Rolleri Ayarla

```bash
# MINTER_ROLE'ü gateway'e ver
cast send <COLLECTION_ADDRESS> \
    "grantRole(bytes32,address)" \
    $(cast keccak "MINTER_ROLE()") \
    <GATEWAY_ADDRESS> \
    --rpc-url $MONAD_RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

# BURNER_ROLE'ü gateway'e ver
cast send <COLLECTION_ADDRESS> \
    "grantRole(bytes32,address)" \
    $(cast keccak "BURNER_ROLE()") \
    <GATEWAY_ADDRESS> \
    --rpc-url $MONAD_RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy
```

Alternatif (Foundry script ile):

```bash
forge script script/DeployLevelUp.s.sol:DeployLevelUp \
    --rpc-url $MONAD_RPC_URL \
    --broadcast \
    --legacy
```

### 3. Testler

```bash
# Tüm testleri çalıştır
forge test -vv

# Detaylı trace ile
forge test -vvvv

# Sadece level up testleri
forge test --match-contract LevelUpTest -vv
```

## 🔐 Güvenlik Özellikleri

### 1. EIP-712 Signed Permits
- Backend tarafından imzalanmış yetkiler
- Domain separator ile chain-specific
- Structured data signing (tipli veri)

### 2. Replay Protection
- Her token için nonce counter
- Her başarılı level up'ta nonce +1
- Eski imzalar tekrar kullanılamaz

### 3. Deadline Check
- Her permit'in geçerlilik süresi var
- `block.timestamp <= deadline` kontrolü
- Expired permit'ler reddedilir

### 4. Processing Lock
- `mapping(uint256 => bool) public processing`
- Aynı token concurrent işlemlerde korumalı
- Race condition önlenir

### 5. State Validation
- `levelOf[tokenId]` ile on-chain state kontrolü
- Permit'teki fromLevel mevcut level ile eşleşmeli
- State drift koruması

### 6. Role-Based Access
- Sadece BURNER_ROLE burn edebilir
- Sadece MINTER_ROLE mint edebilir
- Normal user'lar transfer edebilir ama burn/mint edemez

## 📝 Backend Implementation

### EIP-712 İmzalama (Node.js)

```javascript
const { ethers } = require("ethers");

// Domain
const domain = {
    name: "LevelUpGateway",
    version: "1",
    chainId: 10143, // Monad testnet
    verifyingContract: gatewayAddress
};

// Types
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

// Sign permit
async function signPermit(signer, permit) {
    const signature = await signer.signTypedData(domain, types, permit);
    return signature;
}

// Örnek kullanım
const permit = {
    owner: "0x...",
    tokenId: 1,
    fromLevel: 0,
    toLevel: 1,
    deadline: Math.floor(Date.now() / 1000) + 3600,
    nonce: 0,
    newUri: "ipfs://..."
};

const wallet = new ethers.Wallet(BACKEND_SIGNER_KEY);
const signature = await signPermit(wallet, permit);
```

### Backend API Endpoint Örneği

```javascript
app.post("/api/level-up/prepare", async (req, res) => {
    const { userAddress, tokenId } = req.body;

    // 1. Task completion verify et
    const taskCompleted = await verifyUserTask(userAddress);
    if (!taskCompleted) {
        return res.status(403).json({ error: "Task not completed" });
    }

    // 2. Current NFT bilgilerini al
    const currentLevel = await collection.levelOf(tokenId);
    const owner = await collection.ownerOf(tokenId);

    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(403).json({ error: "Not owner" });
    }

    // 3. AI ile yeni image üret
    const currentImage = await getCurrentImage(tokenId);
    const evolvedImage = await generateEvolvedImage(currentImage, currentLevel + 1);

    // 4. IPFS'e upload
    const ipfsUri = await uploadToIPFS({
        image: evolvedImage,
        name: `Elemental Soul #${tokenId} - Level ${currentLevel + 1}`,
        attributes: [
            { trait_type: "Level", value: currentLevel + 1 }
        ]
    });

    // 5. Nonce al
    const nonce = await gateway.getNonce(tokenId);

    // 6. Permit oluştur ve imzala
    const permit = {
        owner: userAddress,
        tokenId: tokenId,
        fromLevel: currentLevel,
        toLevel: currentLevel + 1,
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 saat
        nonce: nonce,
        newUri: ipfsUri
    };

    const signature = await signPermit(backendWallet, permit);

    // 7. Frontend'e döndür
    res.json({
        permit,
        signature,
        newImagePreview: evolvedImage
    });
});
```

## 🧪 Test Coverage

### Happy Path Tests
- ✅ `test_HappyPath_Level0To1` - Basic level up
- ✅ `test_ConcurrentLevelUps` - Multiple users same block
- ✅ `test_MultipleLevelUps` - Consecutive evolutions

### Security Tests
- ✅ `test_Revert_WrongCollection` - Wrong NFT collection
- ✅ `test_Revert_OwnerMismatch` - Permit owner ≠ sender
- ✅ `test_Revert_Expired` - Deadline passed
- ✅ `test_Revert_BadNonce` - Wrong nonce
- ✅ `test_Revert_BadLevel` - Invalid level jump
- ✅ `test_Revert_StateDrift` - On-chain state mismatch
- ✅ `test_Revert_BadSigner` - Invalid signature
- ✅ `test_Revert_ReplayAttack` - Replay protection

### Transfer Tests
- ✅ `test_NormalTransfer` - NFTs are transferable
- ✅ `test_OnlyGatewayCanBurn` - Burn role protection

### Admin Tests
- ✅ `test_UpdateSigner` - Signer update
- ✅ `test_Revert_UnauthorizedSignerUpdate` - Unauthorized update

## 📊 Gas Costs

| Operation | Gas Cost |
|-----------|----------|
| Mint (initial) | ~129,000 |
| Level Up (burn + mint) | ~285,000 |
| Normal Transfer | ~52,000 |

## 🔗 Contract Addresses (Monad Testnet)

**ElementalSouls:** `0x0a5C90D70153408Bc68dE50601581f9A0a08aB95`
**LevelUpGateway:** `0x066A9C7Fe82C3B1E567C2CE6313B704B11158fDF`
**Backend Signer:** `0xE9fE9341a4193732BC34B37ed58A1EB4144f717B`
**Deployer:** `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38`

**Chain ID:** 10143
**RPC URL:** https://testnet-rpc.monad.xyz

## 📚 Kaynaklar

- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [OpenZeppelin ERC721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [Foundry Book](https://book.getfoundry.sh/)

## ⚠️ Önemli Notlar

1. **Atomicity:** Burn ve mint aynı transaction'da olur. Fail olursa ikisi de revert.

2. **Nonce Management:** Her token için ayrı nonce. Concurrent operations safe.

3. **Deadline:** Backend reasonable deadline vermeli (örn: 1 saat). Çok kısa = UX kötü, çok uzun = güvenlik riski.

4. **Signature Signer:** Backend private key güvenli tutulmalı. Leak olursa başkası permit imzalayabilir.

5. **Gas Costs:** User gas öder (NFT transfer + gateway logic). Backend gas ödemiyor.

6. **State Drift:** Backend permit oluştururken on-chain state'i oku. Permit imzalandıktan sonra başka tx gelirse state değişebilir.

## 🎯 MVP Checklist

- [x] ElementalSouls collection contract
- [x] LevelUpGateway with EIP-712
- [x] Comprehensive test suite
- [x] Deployment scripts
- [ ] Deploy to Monad testnet
- [ ] Backend API for signing permits
- [ ] Frontend integration
- [ ] AI image generation
- [ ] IPFS storage setup

## 🤝 Contribution

Bu implementation Monad hackathon için hazırlanmıştır. Production'da kullanmadan önce:
- Security audit yaptırın
- Gas optimization yapın
- Monitoring ekleyin
- Rate limiting ekleyin (backend API)
