import type { ExpressionSpecification } from 'maplibre-gl';
import { az } from '@/i18n/az';
import {
  MAP_PLACE_TYPE_COLORS,
  MAP_PLACE_TYPE_DEFAULT_COLOR,
} from '@/lib/mapPalette';

/** Dark palette for 2D + 3D map (institutions / POI). */
export const PLACE_TYPE_COLORS = MAP_PLACE_TYPE_COLORS;
export const PLACE_TYPE_DEFAULT_COLOR = MAP_PLACE_TYPE_DEFAULT_COLOR;

export interface PlaceProperties {
  OBJECTID?: number;
  TYPE: string;
  NAME?: string;
  NAME_AZ?: string;
  STRT_ADDR?: string;
  STRT_NAME?: string;
  CITY_AZ?: string;
  STATE_AZ?: string;
  Code_OSM?: string | number | null;
}

export function getPlaceTypeColor(type: string | undefined): string {
  if (!type) return PLACE_TYPE_DEFAULT_COLOR;
  return PLACE_TYPE_COLORS[type] ?? PLACE_TYPE_DEFAULT_COLOR;
}

/** Legend entries sorted by label (grouped visually in UI). */
export const PLACE_LEGEND_ITEMS = Object.keys(PLACE_TYPE_COLORS)
  .sort((a, b) => getPlaceTypeLabel(a).localeCompare(getPlaceTypeLabel(b), 'az'))
  .map((type) => ({ type, color: PLACE_TYPE_COLORS[type] }));

export function getPlaceTypeLabel(type: string): string {
  const key = type as keyof typeof az.map.placeTypes;
  if (key in az.map.placeTypes) {
    return az.map.placeTypes[key];
  }
  if (type.startsWith('CUSTOMIZABLE_POINT')) {
    return az.map.placeTypes.CUSTOMIZABLE_OTHER;
  }
  return type.replace(/_/g, ' ');
}

/** 3D/2D institution buildings: color by matched `placeType`, else muted gray. */
/** Layer filter — avoids rebuilding GeoJSON when toggling types. */
export function buildVisiblePlaceTypesFilter(
  visibleTypes: Record<string, boolean>,
): ExpressionSpecification | undefined {
  const active = Object.keys(PLACE_TYPE_COLORS).filter(
    (type) => visibleTypes[type] !== false,
  );

  if (active.length === Object.keys(PLACE_TYPE_COLORS).length) {
    return undefined;
  }
  if (!active.length) {
    return ['==', ['get', 'placeType'], '__none__'] as unknown as ExpressionSpecification;
  }

  return [
    'any',
    ...active.map((type) => ['==', ['get', 'placeType'], type]),
  ] as unknown as ExpressionSpecification;
}

export function buildInstitutionBuildingColorExpression(): ExpressionSpecification {
  const matchPairs: (string | number)[] = [];
  for (const [type, color] of Object.entries(PLACE_TYPE_COLORS)) {
    matchPairs.push(type, color);
  }

  return [
    'match',
    ['get', 'placeType'],
    ...matchPairs,
    PLACE_TYPE_DEFAULT_COLOR,
  ] as unknown as ExpressionSpecification;
}

export function buildPlaceTypeColorExpression(): ExpressionSpecification {
  const matchPairs: (string | number)[] = [];
  for (const [type, color] of Object.entries(PLACE_TYPE_COLORS)) {
    matchPairs.push(type, color);
  }

  return [
    'match',
    ['get', 'placeType'],
    ...matchPairs,
    PLACE_TYPE_DEFAULT_COLOR,
  ] as unknown as ExpressionSpecification;
}

export function enrichPlacesGeoJson(
  collection: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.map((feature) => {
      const props = (feature.properties ?? {}) as PlaceProperties;
      const placeType = props.TYPE ?? 'UNKNOWN';
      return {
        ...feature,
        properties: {
          ...feature.properties,
          placeType,
        },
      };
    }),
  };
}

export function filterPlacesByVisibleTypes(
  collection: GeoJSON.FeatureCollection,
  visibleTypes: Record<string, boolean>,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.filter((f) => {
      const type = (f.properties as { placeType?: string })?.placeType;
      if (!type) return true;
      return visibleTypes[type] !== false;
    }),
  };
}
