import { Source, Layer } from 'react-map-gl/maplibre';
import { buildBuildingTypeColorExpression } from '@/lib/buildingTypeStyles';
import { MAP_3D_BUILDING_EXTRUSION_OPACITY } from '@/lib/map3dTheme';

const SOURCE_ID = 'buildings-typed';
const LAYER_ID = 'buildings-typed-3d';

interface Props {
  data: GeoJSON.FeatureCollection | undefined;
}

export function TypedBuildings3D({ data }: Props) {
  if (!data?.features.length) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={data}>
      <Layer
        id={LAYER_ID}
        type="fill-extrusion"
        minzoom={14}
        paint={{
          'fill-extrusion-color': buildBuildingTypeColorExpression(),
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': MAP_3D_BUILDING_EXTRUSION_OPACITY,
        }}
      />
    </Source>
  );
}

export const TYPED_BUILDINGS_LAYER_ID = LAYER_ID;
