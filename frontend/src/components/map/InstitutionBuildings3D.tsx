import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl';
import {
  buildInstitutionBuildingColorExpression,
  buildVisiblePlaceTypesFilter,
} from '@/lib/placeTypeStyles';
import { MAP_3D_BUILDING_EXTRUSION_OPACITY } from '@/lib/map3dTheme';

const SOURCE_ID = 'institution-buildings';
const LAYER_ID = 'institution-buildings-3d';

interface Props {
  data: GeoJSON.FeatureCollection | undefined;
  visibleTypes: Record<string, boolean>;
}

export function InstitutionBuildings3D({ data, visibleTypes }: Props) {
  const typeFilter = useMemo(
    () => buildVisiblePlaceTypesFilter(visibleTypes) as FilterSpecification | undefined,
    [visibleTypes],
  );

  const layerProps = useMemo(() => {
    const base = {
      id: LAYER_ID,
      type: 'fill-extrusion' as const,
      minzoom: 14,
      paint: {
        'fill-extrusion-color': buildInstitutionBuildingColorExpression(),
        'fill-extrusion-height': [
          'coalesce',
          ['to-number', ['get', 'height']],
          12,
        ] as ExpressionSpecification,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': MAP_3D_BUILDING_EXTRUSION_OPACITY,
      },
    };
    return typeFilter ? { ...base, filter: typeFilter } : base;
  }, [typeFilter]);

  if (!data?.features.length) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={data}>
      <Layer {...layerProps} />
    </Source>
  );
}

export const INSTITUTION_BUILDINGS_LAYER_ID = LAYER_ID;
