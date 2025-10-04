# Elemental Souls - Metadata Guide

## Collection Info

**Contract:** `0x0a5C90D70153408Bc68dE50601581f9A0a08aB95`
**Symbol:** ELS
**Total Supply:** Dynamic (no max)
**Chain:** Monad Testnet (10143)

## Elements

| Element ID | Name | Color Theme | Starting Egg |
|------------|------|-------------|--------------|
| 0 | Fire | Red/Orange (#FF4500) | Glowing ember egg |
| 1 | Water | Blue/Cyan (#1E90FF) | Crystal water droplet |
| 2 | Earth | Green/Brown (#8B4513) | Stone/moss covered egg |
| 3 | Air | White/Sky (#87CEEB) | Swirling wind vortex |

## Evolution Stages

| Level | Stage Name | Rarity | Power | Description |
|-------|------------|--------|-------|-------------|
| 0 | Egg | Common | 10 | Base form, waiting to hatch |
| 1 | Hatchling | Uncommon | 25 | Just emerged, weak but growing |
| 2 | Sprout | Uncommon | 50 | Beginning to show elemental affinity |
| 3 | Juvenile | Rare | 100 | Developing unique characteristics |
| 4 | Adolescent | Rare | 175 | Gaining control over element |
| 5 | Mature | Epic | 275 | **Milestone: Mature Form** |
| 6 | Advanced | Epic | 400 | Mastering elemental abilities |
| 7 | Elite | Legendary | 550 | Among the strongest souls |
| 8 | Ancient | Legendary | 750 | Ancient elemental wisdom |
| 9 | Ascendant | Mythic | 1000 | Near-godlike power |
| 10 | Transcendent | Mythic | 1500 | **Final Form: Ultimate Power** |

## Metadata Structure

### Standard Fields (ERC721)

```json
{
  "name": "Elemental Soul #{{tokenId}} - {{Element}} {{Stage}}",
  "description": "{{Dynamic description based on level}}",
  "image": "ipfs://{{CID}}/{{element}}-level-{{level}}-{{tokenId}}.png",
  "animation_url": "ipfs://{{CID}}/{{element}}-level-{{level}}-{{tokenId}}.mp4",
  "external_url": "https://elementalsouls.xyz/soul/{{tokenId}}",
  "background_color": "{{Element color hex}}"
}
```

### Attributes

```json
"attributes": [
  {
    "trait_type": "Element",
    "value": "Fire|Water|Earth|Air"
  },
  {
    "trait_type": "Level",
    "value": 0-10,
    "display_type": "number",
    "max_value": 10
  },
  {
    "trait_type": "Stage",
    "value": "Egg|Hatchling|Sprout|..."
  },
  {
    "trait_type": "Rarity",
    "value": "Common|Uncommon|Rare|Epic|Legendary|Mythic"
  },
  {
    "trait_type": "Power",
    "value": 10-1500,
    "display_type": "boost_number"
  },
  {
    "trait_type": "Evolution Count",
    "value": 0-10,
    "display_type": "number"
  },
  {
    "trait_type": "Uniqueness",
    "value": "Genesis|AI Generated"
  },
  {
    "trait_type": "Minted At",
    "value": {{timestamp}},
    "display_type": "date"
  }
]
```

## File Naming Convention

### Images
```
Base (Level 0):
- fire-level-0.png
- water-level-0.png
- earth-level-0.png
- air-level-0.png

Evolved (Level 1+):
- fire-level-1-{{tokenId}}.png     # Unique per token
- water-level-2-{{tokenId}}.png
- earth-level-5-{{tokenId}}.png
- air-level-10-{{tokenId}}.png
```

### Metadata
```
Base:
- fire-level-0.json
- water-level-0.json
- earth-level-0.json
- air-level-0.json

Evolved:
- fire-level-1-token-123.json
- water-level-2-token-456.json
- earth-level-5-token-789.json
```

## AI Generation Prompts

### Fire Element
```
Base: "mystical fire egg, glowing embers, fantasy art, digital painting"

Level 1: "small fire sprite hatching from egg, cute flames, magical creature"
Level 2: "young fire spirit, dancing flames, growing power"
Level 3: "fire elemental juvenile, controlled flames, determined"
Level 4: "fire elemental teen, swirling inferno, building strength"
Level 5: "mature fire being, blazing aura, confident and powerful"
Level 6: "advanced fire entity, intense heat waves, masterful control"
Level 7: "elite fire elemental, volcanic power, legendary warrior"
Level 8: "ancient fire deity, eternal flames, cosmic fire"
Level 9: "ascendant fire god, celestial inferno, reality-bending heat"
Level 10: "transcendent fire avatar, universe ablaze, ultimate flame incarnate"
```

### Water Element
```
Base: "mystical water droplet, shimmering crystal, liquid magic"

Level 1: "small water sprite, gentle ripples, innocent and pure"
Level 2: "young water spirit, flowing streams, playful waves"
Level 3: "water elemental juvenile, controlled currents, focused"
Level 4: "water elemental teen, swirling torrents, rising tide"
Level 5: "mature water being, ocean depths, serene power"
Level 6: "advanced water entity, tsunami force, perfect flow"
Level 7: "elite water elemental, storm surge, legendary depths"
Level 8: "ancient water deity, eternal ocean, primordial seas"
Level 9: "ascendant water god, celestial tides, reality-warping waves"
Level 10: "transcendent water avatar, infinite ocean, ultimate aquatic form"
```

### Earth Element
```
Base: "mystical stone egg, moss covered, ancient runes"

Level 1: "small earth sprite, pebbles and roots, nature awakening"
Level 2: "young earth spirit, growing vines, fertile soil"
Level 3: "earth elemental juvenile, stone armor, grounded strength"
Level 4: "earth elemental teen, mountain peaks, tectonic power"
Level 5: "mature earth being, living mountains, unshakeable"
Level 6: "advanced earth entity, crystal formations, geological mastery"
Level 7: "elite earth elemental, continental plates, legendary titan"
Level 8: "ancient earth deity, planet core, primeval stone"
Level 9: "ascendant earth god, celestial geology, world-shaping power"
Level 10: "transcendent earth avatar, universe foundation, ultimate terra form"
```

### Air Element
```
Base: "mystical wind vortex, swirling mist, ethereal glow"

Level 1: "small air sprite, gentle breeze, innocent whisper"
Level 2: "young air spirit, dancing winds, playful gusts"
Level 3: "air elemental juvenile, controlled storms, focused wind"
Level 4: "air elemental teen, fierce gales, tornado forming"
Level 5: "mature air being, sky sovereign, atmosphere control"
Level 6: "advanced air entity, lightning strikes, storm mastery"
Level 7: "elite air elemental, hurricane force, legendary tempest"
Level 8: "ancient air deity, eternal winds, primordial breath"
Level 9: "ascendant air god, celestial storms, reality-bending winds"
Level 10: "transcendent air avatar, infinite atmosphere, ultimate wind incarnate"
```

## IPFS Upload Structure

```
/collection/
  ├── banner.png
  ├── featured.png
  └── collection.json

/base-assets/
  ├── fire/
  │   ├── level-0.png
  │   └── level-0.json
  ├── water/
  │   ├── level-0.png
  │   └── level-0.json
  ├── earth/
  │   ├── level-0.png
  │   └── level-0.json
  └── air/
      ├── level-0.png
      └── level-0.json

/evolved-assets/
  ├── fire/
  │   └── level-{{N}}/
  │       ├── token-{{ID}}.png
  │       └── token-{{ID}}.json
  ├── water/
  ├── earth/
  └── air/
```

## Backend Metadata Generation

### Example: Generate Level 1 Fire Metadata

```javascript
function generateMetadata(tokenId, element, level, imageCID) {
  const elementNames = ['Fire', 'Water', 'Earth', 'Air'];
  const stages = ['Egg', 'Hatchling', 'Sprout', 'Juvenile', 'Adolescent',
                  'Mature', 'Advanced', 'Elite', 'Ancient', 'Ascendant', 'Transcendent'];
  const rarities = ['Common', 'Uncommon', 'Uncommon', 'Rare', 'Rare',
                    'Epic', 'Epic', 'Legendary', 'Legendary', 'Mythic', 'Mythic'];
  const powers = [10, 25, 50, 100, 175, 275, 400, 550, 750, 1000, 1500];
  const colors = ['FF4500', '1E90FF', '8B4513', '87CEEB'];

  const elementName = elementNames[element];
  const stage = stages[level];
  const rarity = rarities[level];
  const power = powers[level];
  const bgColor = colors[element];

  return {
    name: `Elemental Soul #${tokenId} - ${elementName} ${stage}`,
    description: getDescription(element, level),
    image: `ipfs://${imageCID}/${elementName.toLowerCase()}-level-${level}-${tokenId}.png`,
    external_url: `https://elementalsouls.xyz/soul/${tokenId}`,
    background_color: bgColor,
    attributes: [
      { trait_type: "Element", value: elementName },
      { trait_type: "Level", value: level, display_type: "number", max_value: 10 },
      { trait_type: "Stage", value: stage },
      { trait_type: "Rarity", value: rarity },
      { trait_type: "Power", value: power, display_type: "boost_number" },
      { trait_type: "Evolution Count", value: level, display_type: "number" },
      { trait_type: "Uniqueness", value: level === 0 ? "Genesis" : "AI Generated" },
      { trait_type: "Minted At", value: Date.now(), display_type: "date" }
    ]
  };
}
```

## OpenSea Collection Settings

```
Name: Elemental Souls
Symbol: ELS
Description: Evolving NFT pets that grow through task completion
Category: PFPs
Creator Earnings: 5%
Blockchain: Monad
Collection Banner: ipfs://BANNER_CID
Collection Avatar: ipfs://AVATAR_CID
```

## Marketplaces

- OpenSea: Auto-indexed via metadata
- Rarible: Manual listing required
- LooksRare: Contract verification needed
- Blur: May require whitelist

## Notes

1. **Base Images (Level 0):** Pre-generated, same for all users with same element
2. **Evolved Images (Level 1+):** Unique AI-generated per token
3. **Metadata Updates:** On-chain URI updated during evolution
4. **IPFS Pinning:** Use Pinata/NFT.Storage for permanence
5. **Animation URLs:** Optional, can be added for premium experience
6. **Background Color:** Hex without #, used by marketplaces
