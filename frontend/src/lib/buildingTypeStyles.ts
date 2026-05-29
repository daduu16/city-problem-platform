import type { ExpressionSpecification } from 'maplibre-gl';
import { az } from '@/i18n/az';
import { MAP_BUILDING_TYPE_COLORS } from '@/lib/mapPalette';

/** Dark palette by OSM building type (2D + 3D extrusions). */
export const BUILDING_TYPE_COLORS = MAP_BUILDING_TYPE_COLORS;

export const BUILDING_LEGEND_ITEMS = [
  { id: 'residential', color: BUILDING_TYPE_COLORS.residential },
  { id: 'commercial', color: BUILDING_TYPE_COLORS.commercial },
  { id: 'industrial', color: BUILDING_TYPE_COLORS.industrial },
  { id: 'retail', color: BUILDING_TYPE_COLORS.retail },
  { id: 'office', color: BUILDING_TYPE_COLORS.office },
  { id: 'hotel', color: BUILDING_TYPE_COLORS.hotel },
  { id: 'school', color: BUILDING_TYPE_COLORS.school },
  { id: 'hospital', color: BUILDING_TYPE_COLORS.hospital },
  { id: 'religious', color: BUILDING_TYPE_COLORS.religious },
  { id: 'government', color: BUILDING_TYPE_COLORS.government },
  { id: 'warehouse', color: BUILDING_TYPE_COLORS.warehouse },
  { id: 'garage', color: BUILDING_TYPE_COLORS.garage },
  { id: 'other', color: BUILDING_TYPE_COLORS.other },
] as const;

export type BuildingLegendId = (typeof BUILDING_LEGEND_ITEMS)[number]['id'];

export function getBuildingLegendLabel(id: BuildingLegendId): string {
  return az.map.buildingTypes[id];
}

export function buildBuildingTypeColorExpression(): ExpressionSpecification {
  const matchPairs: (string | number)[] = [];
  for (const { id, color } of BUILDING_LEGEND_ITEMS) {
    matchPairs.push(id, color);
  }

  return [
    'match',
    ['get', 'buildingType'],
    ...matchPairs,
    BUILDING_TYPE_COLORS.other,
  ] as unknown as ExpressionSpecification;
}
