import { Polygon } from 'react-leaflet';
import { DISTRICT_HIGHLIGHT } from '@/lib/mapConfig';
import type { NarimanovRayonData } from '@/lib/narimanovRayon';

interface Props {
  rayon: NarimanovRayonData;
}

export function DistrictHighlight2D({ rayon }: Props) {
  return (
    <Polygon
      positions={rayon.positions}
      pathOptions={{
        color: DISTRICT_HIGHLIGHT.color,
        fillColor: DISTRICT_HIGHLIGHT.color,
        fillOpacity: DISTRICT_HIGHLIGHT.fillOpacity,
        weight: DISTRICT_HIGHLIGHT.lineWidth,
      }}
    />
  );
}
