import { useMemo } from 'react';
import type { MapIncident } from '@/types';
import { categoryKeyToLayer } from '@/lib/categoryLayers';
import { useMapStore } from '@/stores/mapStore';

/** Incidents visible for current category layer toggles (shared by 2D and 3D maps). */
export function useFilteredMapIncidents(incidents: MapIncident[]) {
  const layers = useMapStore((s) => s.layers);

  return useMemo(() => {
    return incidents.filter((i) => {
      const layerKey = categoryKeyToLayer[i.category.key];
      if (!layerKey) return true;
      return layers[layerKey];
    });
  }, [incidents, layers]);
}
