import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { TYPED_BUILDINGS_LAYER_ID } from '@/components/map/TypedBuildings3D';
import { INSTITUTION_BUILDINGS_LAYER_ID } from '@/components/map/InstitutionBuildings3D';

const OVERLAY_LAYER_IDS = [
  'incident-heatmap',
  'incident-clusters',
  'incident-cluster-count',
  'district-fill',
  'district-outline',
  TYPED_BUILDINGS_LAYER_ID,
  INSTITUTION_BUILDINGS_LAYER_ID,
] as const;

function setLayoutIfLayer(
  map: MaplibreMap,
  layerId: string,
  prop: string,
  value: unknown,
) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, prop, value);
}

interface Props {
  /** When true, hide default style buildings (typed OSM layer is shown). */
  hideBaseBuildings: boolean;
}

export function Map3DStyleEnhancer({ hideBaseBuildings }: Props) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;

      const baseVisibility = hideBaseBuildings ? 'none' : 'visible';
      setLayoutIfLayer(map, 'building-3d', 'visibility', baseVisibility);
      setLayoutIfLayer(map, 'building', 'visibility', baseVisibility);

      for (const id of OVERLAY_LAYER_IDS) {
        if (map.getLayer(id)) {
          try {
            map.moveLayer(id);
          } catch {
            /* not ready */
          }
        }
      }
    };

    apply();
    map.on('styledata', apply);

    return () => {
      map.off('styledata', apply);
    };
  }, [mapRef, hideBaseBuildings]);

  return null;
}
