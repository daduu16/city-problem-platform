import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { TYPED_BUILDINGS_LAYER_ID } from '@/components/map/TypedBuildings3D';
import { INSTITUTION_BUILDINGS_LAYER_ID } from '@/components/map/InstitutionBuildings3D';
import { PLACES_LAYER_ID } from '@/components/map/PlacesLayer3D';

/** App layers that must render above the basemap (and above 3D buildings). */
const OVERLAY_LAYER_IDS = [
  'district-fill',
  'district-outline',
  TYPED_BUILDINGS_LAYER_ID,
  INSTITUTION_BUILDINGS_LAYER_ID,
  PLACES_LAYER_ID,
  'incident-heatmap',
] as const;

const ROAD_LINE_LAYERS = [
  'road_minor',
  'road_major',
  'road_trunk',
  'road_motorway',
  'road_primary',
  'road_secondary',
  'road_tertiary',
  'road_service',
  'road_path',
  'highway',
  'highway_major',
  'highway_minor',
  'highway_motorway',
  'transportation',
  'transportation_name',
];

function setLayoutIfLayer(
  map: MaplibreMap,
  layerId: string,
  prop: string,
  value: unknown,
) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, prop, value);
}

function muteRoadLayers(map: MaplibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    if (layer.type !== 'line') continue;
    const id = layer.id;
    const isRoad =
      ROAD_LINE_LAYERS.some((key) => id.includes(key)) ||
      id.includes('road') ||
      id.includes('highway') ||
      id.includes('bridge') ||
      id.includes('tunnel');

    if (!isRoad) continue;

    try {
      map.setPaintProperty(id, 'line-color', [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        'hsl(220 14% 22%)',
        14,
        'hsl(220 12% 28%)',
        16,
        'hsl(220 10% 32%)',
      ]);
      map.setPaintProperty(id, 'line-opacity', 0.85);
    } catch {
      /* layer may not support line-color */
    }
  }
}

function muteBackground(map: MaplibreMap) {
  try {
    map.setPaintProperty('background', 'background-color', 'hsl(222 24% 6%)');
  } catch {
    /* no background layer */
  }
}

interface Props {
  hideBaseBuildings: boolean;
}

export function Map3DStyleEnhancer({ hideBaseBuildings }: Props) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;

      muteBackground(map);
      muteRoadLayers(map);

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
