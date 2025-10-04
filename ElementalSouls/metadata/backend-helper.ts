/**
 * Elemental Souls - Backend Metadata Helper
 *
 * This file contains all the constants and functions needed to generate
 * metadata for base and evolved NFTs.
 */

// ============ CONSTANTS ============

export const BASE_IMAGES = {
  FIRE: 'bafybeigbcyli4bo6g2b6c3bwirpul5nobhiailfox2lkiepfzstaqrktfe',
  WATER: 'bafybeigwa4ee3rddizv2unijvwcbln7ygvtubl3brnuol3ijmutnujx7zm',
  EARTH: 'bafybeia3bwsbtdyaarklxejnp5jvx2kbthokfhdzwcquerrjysgg6zxq7a',
  AIR: 'bafybeidoluxp77kb75awwbvq5yt2xtpnorrn6rfbnbu64hqwep64xbfady'
} as const;

export const ELEMENT_NAMES = ['Fire', 'Water', 'Earth', 'Air'] as const;
export const ELEMENT_COLORS = ['FF4500', '1E90FF', '8B4513', '87CEEB'] as const;

export const STAGES = [
  'Egg',        // Level 0
  'Hatchling',  // Level 1
  'Sprout',     // Level 2
  'Juvenile',   // Level 3
  'Adolescent', // Level 4
  'Mature',     // Level 5
  'Advanced',   // Level 6
  'Elite',      // Level 7
  'Ancient',    // Level 8
  'Ascendant',  // Level 9
  'Transcendent' // Level 10
] as const;

export const BASE_STAGES = ['Egg', 'Droplet', 'Seed', 'Whisper'] as const;

export const RARITIES = [
  'Common',    // Level 0
  'Uncommon',  // Level 1
  'Uncommon',  // Level 2
  'Rare',      // Level 3
  'Rare',      // Level 4
  'Epic',      // Level 5
  'Epic',      // Level 6
  'Legendary', // Level 7
  'Legendary', // Level 8
  'Mythic',    // Level 9
  'Mythic'     // Level 10
] as const;

export const POWER_LEVELS = [
  10,   // Level 0
  25,   // Level 1
  50,   // Level 2
  100,  // Level 3
  175,  // Level 4
  275,  // Level 5
  400,  // Level 6
  550,  // Level 7
  750,  // Level 8
  1000, // Level 9
  1500  // Level 10
] as const;

export const BASE_DESCRIPTIONS = {
  0: "A nascent fire soul, pulsing with inner heat. This elemental egg awaits its first awakening. Complete tasks to help it evolve into its next form.",
  1: "A pristine water droplet, shimmering with potential. This elemental essence awaits its awakening. Complete tasks to help it flow into its next form.",
  2: "An ancient stone seed, covered in moss and etched with runes. This grounded essence waits to sprout. Complete tasks to help it grow into its next form.",
  3: "A swirling vortex of ethereal wind, barely visible. This airy essence floats in anticipation. Complete tasks to help it breeze into its next form."
} as const;

// ============ TYPES ============

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
  max_value?: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  background_color: string;
  attributes: NFTAttribute[];
  animation_url?: string;
}

export type Element = 0 | 1 | 2 | 3; // Fire, Water, Earth, Air
export type Level = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ============ HELPER FUNCTIONS ============

/**
 * Get IPFS image CID for a specific element
 */
export function getElementImageCID(element: Element): string {
  const images = [BASE_IMAGES.FIRE, BASE_IMAGES.WATER, BASE_IMAGES.EARTH, BASE_IMAGES.AIR];
  return images[element];
}

/**
 * Get element name by ID
 */
export function getElementName(element: Element): string {
  return ELEMENT_NAMES[element];
}

/**
 * Get element color by ID
 */
export function getElementColor(element: Element): string {
  return ELEMENT_COLORS[element];
}

/**
 * Get stage name by level
 */
export function getStageName(level: Level): string {
  return STAGES[level];
}

/**
 * Get base stage name by element (Level 0 only)
 */
export function getBaseStage(element: Element): string {
  return BASE_STAGES[element];
}

/**
 * Get rarity by level
 */
export function getRarity(level: Level): string {
  return RARITIES[level];
}

/**
 * Get power by level
 */
export function getPower(level: Level): number {
  return POWER_LEVELS[level];
}

/**
 * Generate description for evolved NFT
 */
export function getEvolvedDescription(element: Element, level: Level): string {
  const elementName = getElementName(element).toLowerCase();
  const stage = getStageName(level).toLowerCase();
  const power = getPower(level);

  const templates = {
    1: `The egg has cracked, revealing a flickering ${elementName} sprite. Its first evolution marks the beginning of a powerful journey.`,
    2: `A young ${elementName} spirit begins to take form, showing its elemental affinity more clearly.`,
    3: `The juvenile ${elementName} elemental develops unique characteristics and growing power.`,
    4: `An adolescent ${elementName} being, gaining mastery over its element with each passing moment.`,
    5: `A mature ${elementName} entity has emerged, radiating ${power} units of pure elemental energy. This is a milestone achievement.`,
    6: `An advanced ${elementName} master, demonstrating exceptional control and devastating power.`,
    7: `An elite ${elementName} elemental, among the strongest souls ever created. Legendary status achieved.`,
    8: `An ancient ${elementName} deity, carrying the wisdom and might of countless ages.`,
    9: `An ascendant ${elementName} god, approaching the pinnacle of elemental perfection.`,
    10: `The ultimate ${elementName} avatar - a transcendent being of unimaginable power. The apex of evolution.`
  };

  return templates[level as keyof typeof templates] || `A ${stage} ${elementName} soul with ${power} power.`;
}

// ============ MAIN FUNCTIONS ============

/**
 * Generate metadata for a base NFT (Level 0)
 */
export function generateBaseMetadata(tokenId: number, element: Element): NFTMetadata {
  const elementName = getElementName(element);
  const stage = getBaseStage(element);
  const imageCID = getElementImageCID(element);
  const bgColor = getElementColor(element);
  const description = BASE_DESCRIPTIONS[element];

  return {
    name: `Elemental Soul #${tokenId} - ${elementName} ${stage}`,
    description,
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

/**
 * Generate metadata for an evolved NFT (Level 1+)
 */
export function generateEvolvedMetadata(
  tokenId: number,
  element: Element,
  level: Level,
  imageCID: string,
  evolutionCount?: number
): NFTMetadata {
  if (level === 0) {
    return generateBaseMetadata(tokenId, element);
  }

  const elementName = getElementName(element);
  const stage = getStageName(level);
  const bgColor = getElementColor(element);
  const rarity = getRarity(level);
  const power = getPower(level);
  const description = getEvolvedDescription(element, level);

  return {
    name: `Elemental Soul #${tokenId} - ${elementName} ${stage}`,
    description,
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
        value: level,
        display_type: "number",
        max_value: 10
      },
      {
        trait_type: "Stage",
        value: stage
      },
      {
        trait_type: "Rarity",
        value: rarity
      },
      {
        trait_type: "Power",
        value: power,
        display_type: "boost_number"
      },
      {
        trait_type: "Evolution Count",
        value: evolutionCount ?? level,
        display_type: "number"
      },
      {
        trait_type: "Uniqueness",
        value: "AI Generated"
      }
    ]
  };
}

/**
 * Convert IPFS URL to HTTP gateway URL
 */
export function ipfsToHttp(ipfsUrl: string, gateway = 'https://ipfs.io'): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    return `${gateway}/ipfs/${cid}`;
  }
  return ipfsUrl;
}

/**
 * Convert HTTP gateway URL to IPFS URL
 */
export function httpToIpfs(httpUrl: string): string {
  const match = httpUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  if (match) {
    return `ipfs://${match[1]}`;
  }
  return httpUrl;
}

// ============ USAGE EXAMPLES ============

/**
 * Example: Mint base Fire NFT
 */
export function exampleBaseMint() {
  const tokenId = 1;
  const element: Element = 0; // Fire

  const metadata = generateBaseMetadata(tokenId, element);

  console.log('Base Fire NFT Metadata:', JSON.stringify(metadata, null, 2));

  // Upload metadata to IPFS
  // const metadataURI = await uploadToIPFS(metadata);

  // Mint on-chain
  // await collection.mint(userAddress, element, metadataURI);
}

/**
 * Example: Evolve to Level 1
 */
export function exampleEvolution() {
  const tokenId = 1;
  const element: Element = 0; // Fire
  const level: Level = 1;
  const evolvedImageCID = 'QmNewImage123...';

  const metadata = generateEvolvedMetadata(tokenId, element, level, evolvedImageCID);

  console.log('Evolved Fire NFT Metadata:', JSON.stringify(metadata, null, 2));

  // Upload metadata to IPFS
  // const metadataURI = await uploadToIPFS(metadata);

  // Create signed permit
  // const permit = createPermit(tokenId, 0, 1, metadataURI);
  // const signature = await signPermit(permit);

  // Return to frontend
  // return { permit, signature, preview: metadata };
}

// ============ EXPORT ALL ============

export default {
  // Constants
  BASE_IMAGES,
  ELEMENT_NAMES,
  ELEMENT_COLORS,
  STAGES,
  BASE_STAGES,
  RARITIES,
  POWER_LEVELS,
  BASE_DESCRIPTIONS,

  // Functions
  getElementImageCID,
  getElementName,
  getElementColor,
  getStageName,
  getBaseStage,
  getRarity,
  getPower,
  getEvolvedDescription,
  generateBaseMetadata,
  generateEvolvedMetadata,
  ipfsToHttp,
  httpToIpfs,

  // Examples
  exampleBaseMint,
  exampleEvolution
};
