# ElementalSouls NFT Contract

A gamified Soulbound NFT system where users mint elemental companions (Fire, Water, Earth, Air) that evolve through completing real-world and on-chain tasks. Each evolution generates a UNIQUE AI-generated image while maintaining the core elemental identity.

## Features

- **Soulbound Tokens**: Non-transferable NFTs to prevent mercenary behavior
- **Progressive Evolution**: 10 levels of evolution with unique artwork
- **Task-Gated Progression**: Prevents pay-to-win mechanics
- **EIP-712 Signature Authorization**: Gas-free evolution validation
- **Element-Based System**: Four base elements (Fire, Water, Earth, Air)

## Contract Structure

### Core Components
- `ElementalSouls.sol`: Main NFT contract implementing ERC721 with custom evolution mechanics
- `src/`: Solidity source files
- `test/`: Contract test files
- `script/`: Deployment and verification scripts

### Key Functions

#### Minting
```solidity
function mint(address to, uint8 element, string calldata uri) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256)
```
- Creates a new elemental soul at level 0
- Each address can only mint one soul
- Elements: 0=Fire, 1=Water, 2=Earth, 3=Air

#### Evolution
```solidity
function evolve(EvolvePermit calldata permit, bytes calldata signature) external
```
- Evolves an NFT to the next level using a signed permit
- Requires EIP-712 signature from authorized signer
- Updates token URI to new AI-generated artwork

#### Admin Functions
- `updateSigner(address newSigner)`: Updates the authorized signer address
- `togglePause()`: Emergency pause/unpause of contract functions

## Setup & Deployment

### Prerequisites
1. Install Foundry:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. Install dependencies:
   ```bash
   forge install
   ```

### Environment Configuration
Copy `.env.example` to `.env` and update with your values:
```bash
PRIVATE_KEY=0x... # Deployer private key
SIGNER_ADDRESS=0x... # Backend service signer address
MONAD_RPC_URL=https://testnet.monad.dev/
```

### Build
```bash
forge build
```

### Test
```bash
forge test
```

### Deploy
```bash
forge script script/ElementalSouls.s.sol:ElementalSoulsScript --rpc-url $MONAD_RPC_URL --broadcast
```

### Verify
```bash
forge verify-contract <contract_address> src/ElementalSouls.sol:ElementalSouls --chain-id <monad_chain_id> --constructor-args $(cast abi-encode "constructor(address)" $SIGNER_ADDRESS)
```

## Technical Details

### Roles
- **DEFAULT_ADMIN_ROLE**: Contract deployer, can pause/unpause
- **ADMIN_ROLE**: Can update signer address
- **MINTER_ROLE**: Can mint new NFTs
- **SIGNER_ROLE**: Backend service that signs evolution permits

### Evolution Process
1. User completes required tasks in the backend
2. Backend generates new AI artwork and metadata
3. Backend creates and signs an EIP-712 permit for evolution
4. User calls `evolve()` function with permit and signature
5. Contract validates signature and updates token level/URI

### Security
- Nonce-based replay protection
- Deadline expiration for permits
- Role-based access control
- ReentrancyGuard protection
- Soulbound enforcement (transfer functions disabled)

## Directory Structure
```
ElementalSouls/
├── src/
│   ├── ElementalSouls.sol # Main contract
├── test/
│   ├── ElementalSouls.t.sol # Contract tests
├── script/
│   ├── ElementalSouls.s.sol # Deployment script
│   └── VerifyElementalSouls.s.sol # Verification script
├── lib/ # Dependencies
├── out/ # Compilation artifacts
└── cache/ # Build cache
```

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/
