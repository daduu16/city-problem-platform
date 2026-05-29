import { ALL_STATUSES } from '@/lib/incidentStyles';
import { ALL_INCIDENT_TYPES } from '@/lib/incidentTypeStyles';
import { categoryKeyToLayer } from '@/lib/categoryLayers';
import type { MapLayerKey } from '@/stores/mapStore';
import type { IncidentStatus, IncidentType, MapIncident } from '@/types';

export function countIncidentsByStatus(
  incidents: MapIncident[],
  statuses: IncidentStatus[] = ALL_STATUSES,
): Record<IncidentStatus, number> {
  const counts = Object.fromEntries(
    statuses.map((s) => [s, 0]),
  ) as Record<IncidentStatus, number>;
  for (const incident of incidents) {
    if (statuses.includes(incident.status)) {
      counts[incident.status] = (counts[incident.status] ?? 0) + 1;
    }
  }
  return counts;
}

export function countIncidentsByType(
  incidents: MapIncident[],
): Record<IncidentType, number> {
  const counts = Object.fromEntries(
    ALL_INCIDENT_TYPES.map((t) => [t, 0]),
  ) as Record<IncidentType, number>;
  for (const incident of incidents) {
    counts[incident.type] = (counts[incident.type] ?? 0) + 1;
  }
  return counts;
}

export function countIncidentsByLayer(
  incidents: MapIncident[],
  layerKeys: MapLayerKey[],
): Record<MapLayerKey, number> {
  const counts = Object.fromEntries(
    layerKeys.map((k) => [k, 0]),
  ) as Record<MapLayerKey, number>;
  for (const incident of incidents) {
    const layerKey = categoryKeyToLayer[incident.category.key];
    if (layerKey) counts[layerKey]++;
  }
  return counts;
}
