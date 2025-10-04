import type { MetadataAttribute } from '@elementalsouls/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { toGatewayUrl } from '@/lib/ipfs.js';

interface Props {
  element: string;
  level: number;
  imageCid?: string;
  attributes?: MetadataAttribute[];
  header?: string;
}

export const MetadataPreview = ({ element, level, imageCid, attributes, header }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>{header ?? 'Metadata Preview'}</CardTitle>
      <CardDescription>
        Level {level} {element} Soul metadata that will be uploaded to IPFS.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-[220px_1fr]">
      <div className="overflow-hidden rounded-lg border bg-muted">
        {imageCid ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={toGatewayUrl(imageCid)}
            alt={`${element} level ${level}`}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center text-sm text-muted-foreground">
            Awaiting image CID
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge>{element}</Badge>
          <Badge variant="outline">Level {level}</Badge>
          {imageCid && <code className="truncate text-xs text-muted-foreground">{imageCid}</code>}
        </div>
        {attributes && attributes.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Attributes</p>
            <ul className="grid gap-1 text-sm text-muted-foreground">
              {attributes.map((attr) => (
                <li key={attr.trait_type}>
                  {attr.trait_type}: <span className="font-medium text-foreground">{String(attr.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
