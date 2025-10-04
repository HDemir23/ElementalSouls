// Complete ABI for ElementalSouls contract (0xEb44E4b7a35E41eFFDe3d8D656D076cE4e4cD5d3)
export const ELEMENTAL_SOULS_ABI = [
  // Read functions
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getSoul',
    outputs: [
      { name: 'element', type: 'uint8' },
      { name: 'level', type: 'uint8' },
      { name: 'uri', type: 'string' },
      { name: 'mintedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'tokensOfOwner',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'userMintCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions (backend calls these)
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'element', type: 'uint8' },
      { name: 'uri', type: 'string' },
    ],
    name: 'mintBase',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'element', type: 'uint8' },
      { name: 'level', type: 'uint8' },
      { name: 'uri', type: 'string' },
    ],
    name: 'mintEvolved',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Write functions (user calls from frontend)
  {
    inputs: [
      { name: 'oldTokenId', type: 'uint256' },
      { name: 'newUri', type: 'string' },
    ],
    name: 'evolve',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'togglePause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'minter', type: 'address' }],
    name: 'addMinter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'minter', type: 'address' }],
    name: 'removeMinter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'element', type: 'uint8' },
      { indexed: false, name: 'level', type: 'uint8' },
      { indexed: false, name: 'uri', type: 'string' },
    ],
    name: 'SoulMinted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'oldTokenId', type: 'uint256' },
      { indexed: true, name: 'newTokenId', type: 'uint256' },
      { indexed: false, name: 'fromLevel', type: 'uint8' },
      { indexed: false, name: 'toLevel', type: 'uint8' },
      { indexed: false, name: 'newUri', type: 'string' },
    ],
    name: 'SoulEvolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'level', type: 'uint8' },
    ],
    name: 'SoulBurned',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: 'paused', type: 'bool' }],
    name: 'PauseToggled',
    type: 'event',
  },
] as const;
