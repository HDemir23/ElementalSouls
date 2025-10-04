export const toGatewayUrl = (uri?: string) => {
  if (!uri) return undefined;
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return uri;
};
