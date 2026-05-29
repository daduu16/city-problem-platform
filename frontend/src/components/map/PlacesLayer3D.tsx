import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { MAP_POINT_STROKE } from '@/lib/mapPalette';
import {
  buildPlaceTypeColorExpression,
  filterPlacesByVisibleTypes,
} from '@/lib/placeTypeStyles';

const SOURCE_ID = 'narimanov-places';
const LAYER_ID = 'places-by-type';

interface Props {
  data: GeoJSON.FeatureCollection;
  visible: boolean;
  visibleTypes: Record<string, boolean>;
}

export function PlacesLayer3D({ data, visible, visibleTypes }: Props) {
  const filtered = useMemo(
    () => filterPlacesByVisibleTypes(data, visibleTypes),
    [data, visibleTypes],
  );

  if (!visible || filtered.features.length === 0) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={filtered}>
      <Layer
        id={LAYER_ID}
        type="circle"
        paint={{
          'circle-color': buildPlaceTypeColorExpression(),
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            3,
            16,
            6,
          ],
          'circle-stroke-color': MAP_POINT_STROKE,
          'circle-stroke-width': 1,
          'circle-opacity': 0.88,
        }}
      />
    </Source>
  );
}

export const PLACES_LAYER_ID = LAYER_ID;
