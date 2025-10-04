import type { Element, MetadataAttribute } from '@elementalsouls/shared';

interface BaseMetadataParams {
  tokenId?: bigint;
  element: Element;
  level: number;
  imageCid: string;
  attributes?: MetadataAttribute[];
}

const baseAttributes = (element: Element, level: number): MetadataAttribute[] => [
  { trait_type: 'Element', value: element },
  { trait_type: 'Level', value: level }
];

const mergeAttributes = (
  element: Element,
  level: number,
  attributes?: MetadataAttribute[]
) => {
  const base = baseAttributes(element, level);
  if (!attributes) return base;

  const merged = [...base];
  const overrideMap = new Map(attributes.map((attr) => [attr.trait_type, attr] as const));

  return merged.map((attr) => overrideMap.get(attr.trait_type) ?? attr).concat(
    attributes.filter((attr) => !base.find((b) => b.trait_type === attr.trait_type))
  );
};

export const buildBaseMetadata = ({
  element,
  level,
  imageCid,
  attributes
}: BaseMetadataParams) => {
  const name = `Elemental Soul Lv.${level} (${element})`;
  const description =
    'ElementalSoul minted via ElementalSouls gateway. Generated image hosted on IPFS.';

  return {
    name,
    description,
    image: imageCid,
    attributes: mergeAttributes(element, level, attributes)
  };
};

export const buildEvolvedMetadata = ({
  element,
  level,
  imageCid,
  attributes
}: BaseMetadataParams) => {
  return buildBaseMetadata({ element, level, imageCid, attributes });
};
