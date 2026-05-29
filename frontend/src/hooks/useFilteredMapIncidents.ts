import { useMemo } from 'react';
import type { MapIncident } from '@/types';
import { categoryKeyToLayer } from '@/lib/categoryLayers';
import { filterIncidentsByDateRange } from '@/lib/filterIncidentsByDateRange';
import { useMapStore } from '@/stores/mapStore';

/** Incidents visible for date range + category layer toggles (shared by 2D and 3D maps). */
export function useFilteredMapIncidents(incidents: MapIncident[]) {
  const layers = useMapStore((s) => s.layers);
  const mapDateFrom = useMapStore((s) => s.mapDateFrom);
  const mapDateTo = useMapStore((s) => s.mapDateTo);

  return useMemo(() => {
    const byDate = filterIncidentsByDateRange(incidents, mapDateFrom, mapDateTo);
    return byDate.filter((i) => {
      const layerKey = categoryKeyToLayer[i.category.key];
      if (!layerKey) return true;
      return layers[layerKey];
    });
  }, [incidents, layers, mapDateFrom, mapDateTo]);
}
