import type { ExpressionSpecification } from 'maplibre-gl';
import { az } from '@/i18n/az';

/** Colors by normalized OSM building type (`buildingType` feature property). */
export const BUILDING_TYPE_COLORS: Record<string, string> = {
  residential: '#5b9bd5',
  commercial: '#e8985a',
  industrial: '#9b8ec4',
  retail: '#f4a261',
  office: '#7eb6e0',
  hotel: '#c77dff',
  school: '#7bc96f',
  hospital: '#ef6b6b',
  religious: '#d4b85a',
  government: '#6c8ebf',
  warehouse: '#a78b71',
  garage: '#9ca3af',
  other: '#6b7280',
};

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
