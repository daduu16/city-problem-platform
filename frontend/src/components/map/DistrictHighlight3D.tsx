import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { DISTRICT_HIGHLIGHT } from '@/lib/mapConfig';
import type { NarimanovRayonData } from '@/lib/narimanovRayon';

const DISTRICT_SOURCE = 'narimanov-district';

interface Props {
  rayon: NarimanovRayonData;
}

export function DistrictHighlight3D({ rayon }: Props) {
  const collection = useMemo(
    (): GeoJSON.FeatureCollection => ({
      type: 'FeatureCollection',
      features: [rayon.feature],
    }),
    [rayon.feature],
  );

  return (
    <Source id={DISTRICT_SOURCE} type="geojson" data={collection}>
      <Layer
        id="district-fill"
        type="fill"
        paint={{
          'fill-color': DISTRICT_HIGHLIGHT.color,
          'fill-opacity': DISTRICT_HIGHLIGHT.fillOpacity,
        }}
      />
      <Layer
        id="district-outline"
        type="line"
        paint={{
          'line-color': DISTRICT_HIGHLIGHT.color,
          'line-width': DISTRICT_HIGHLIGHT.lineWidth,
        }}
      />
    </Source>
  );
}
