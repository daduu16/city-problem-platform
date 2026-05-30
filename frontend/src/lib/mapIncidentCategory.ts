import { canViewCategory } from '@/lib/mapCategories';
import { MAP_LEAF_CATEGORY_KEYS, getMapCategoryLabel } from '@/lib/mapCategoryTree';
import type { MapIncident } from '@/types';

/** Category key used for map visibility toggles. */
export function getIncidentFilterCategoryKey(incident: MapIncident): string {
  return incident.subcategory?.key ?? incident.category.key;
}

export function collectCategoryKeysFromIncidents(
  incidents: MapIncident[],
): string[] {
  const keys = new Set<string>();
  for (const incident of incidents) {
    keys.add(incident.category.key);
    if (incident.subcategory?.key) {
      keys.add(incident.subcategory.key);
    }
  }
  return [...keys];
}

export function buildCategoryLabelMap(
  incidents: MapIncident[],
): Map<string, string> {
  const labels = new Map<string, string>();
  for (const incident of incidents) {
    labels.set(incident.category.key, incident.category.name);
    if (incident.subcategory) {
      labels.set(incident.subcategory.key, incident.subcategory.name);
    }
  }
  return labels;
}

/** Checkbox rows: catalog leaves + any keys present in loaded incidents. */
export function buildMapCategoryCheckboxKeys(
  incidents: MapIncident[],
  hasMapLayer: (accessKey: string) => boolean,
): string[] {
  const fromIncidents = collectCategoryKeysFromIncidents(incidents);
  const merged = new Set<string>([
    ...MAP_LEAF_CATEGORY_KEYS.filter((k) => canViewCategory(k, hasMapLayer)),
    ...fromIncidents.filter((k) => canViewCategory(k, hasMapLayer)),
  ]);

  const labels = buildCategoryLabelMap(incidents);
  return [...merged].sort((a, b) =>
    resolveMapCategoryLabel(a, labels).localeCompare(
      resolveMapCategoryLabel(b, labels),
      'az',
    ),
  );
}

export function resolveMapCategoryLabel(
  key: string,
  labels?: Map<string, string>,
): string {
  return labels?.get(key) ?? getMapCategoryLabel(key);
}

export function isIncidentCategoryVisible(
  incident: MapIncident,
  visibleCategories: Record<string, boolean>,
): boolean {
  return visibleCategories[getIncidentFilterCategoryKey(incident)] === true;
}
