# How to Interact with ElementalSouls Smart Contract

This guide explains how to interact with the deployed ElementalSouls smart contract on Monad Testnet.

## Contract Details

- **Address**: `0xad620f977fb2bb3e2cc5f3ea99ad37007498d41f`
- **Chain ID**: 10143 (Monad Testnet)
- **RPC Endpoint**: `https://testnet-rpc.monad.ai:80/rpc`

## Functions

### Mint
Create a new Elemental Soul NFT.

```solidity
function mint(address to, uint8 element, string uri) external returns (uint256)
```

Parameters:
- `to`: Address to mint the NFT to
- `element`: Element type (0=Fire, 1=Water, 2=Earth, 3=Air)
- `uri`: Metadata URI

### Evolve
Evolve an existing NFT to the next level using a permit.

```solidity
function evolve(EvolvePermit permit, bytes signature) external
```

Parameters:
- `permit`: Struct containing evolution details
- `signature`: Signature from backend service

### View Functions

- `tokenURI(uint256 tokenId)`: Get metadata URI for a token
- `tokenLevel(uint256 tokenId)`: Get current level of a token
- `tokenElement(uint256 tokenId)`: Get element type of a token
- `tokenNonce(uint256 tokenId)`: Get nonce for a token
- `lastEvolveTime(uint256 tokenId)`: Get timestamp of last evolution
- `totalEvolutions(uint256 tokenId)`: Get total number of evolutions
- `ownerOf(uint256 tokenId)`: Get owner address of a token
- `userMintCount(address user)`: Get number of NFTs minted by user

## Events

### Minted
Emitted when a new NFT is minted.

```solidity
event Minted(address indexed owner, uint256 indexed tokenId, uint8 element, string uri)
```

### Evolved
Emitted when an NFT evolves to a new level.

```solidity
event Evolved(address indexed owner, uint256 indexed tokenId, uint8 fromLevel, uint8 toLevel, string newUri, uint256 timestamp)
```

## Frontend Integration

The frontend uses wagmi v2 and RainbowKit for wallet integration. Key components:

1. **Wallet Connection**: Uses `WalletConnectButton` component
2. **Minting**: Uses `NFTMintCard` component
3. **Evolution**: Uses `NFTUpgradeCard` component
4. **NFT Data**: Uses `useNFTData` hook to fetch on-chain data
5. **Transaction Tracking**: Uses `useTxHistory` hook to track transactions

## Backend Integration

The backend provides:

1. **Metadata Generation**: AI-generated metadata for each evolution
2. **Permit Signing**: EIP-712 permits for evolution transactions
3. **Task Tracking**: Off-chain task completion tracking

To interact with the backend:
- Set `NEXT_PUBLIC_API_URL` environment variable
- Call `/evolution/request` to start an evolution job
- Poll `/evolution/status/{jobId}` to get permit and signature

## Block Explorer

View transactions and contract details on [Monad Testnet Explorer](https://testnet-explorer.monad.ai/).