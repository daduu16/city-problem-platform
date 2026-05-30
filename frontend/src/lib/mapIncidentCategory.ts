import { canViewCategory } from '@/lib/mapCategories';
import {
  ALL_INCIDENT_LEAF_CATEGORY_KEYS,
  mergeCategoryLabelsFromIncidents,
  resolveCategoryLabel,
} from '@/lib/categoryTree';
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
  return mergeCategoryLabelsFromIncidents(incidents);
}

/** Leaf keys from full catalog + any extra keys on loaded incidents. */
export function buildMapCategoryCheckboxKeys(
  incidents: MapIncident[],
  hasMapLayer: (accessKey: string) => boolean,
): string[] {
  const fromIncidents = collectCategoryKeysFromIncidents(incidents);
  const merged = new Set<string>([
    ...ALL_INCIDENT_LEAF_CATEGORY_KEYS.filter((k) => canViewCategory(k, hasMapLayer)),
    ...fromIncidents.filter((k) => canViewCategory(k, hasMapLayer)),
  ]);

  const labels = buildCategoryLabelMap(incidents);
  return [...merged].sort((a, b) =>
    resolveCategoryLabel(a, labels).localeCompare(
      resolveCategoryLabel(b, labels),
      'az',
    ),
  );
}

export function resolveMapCategoryLabel(
  key: string,
  labels?: Map<string, string>,
): string {
  return resolveCategoryLabel(key, labels);
}

export function isIncidentCategoryVisible(
  incident: MapIncident,
  visibleCategories: Record<string, boolean>,
): boolean {
  return visibleCategories[getIncidentFilterCategoryKey(incident)] === true;
}
