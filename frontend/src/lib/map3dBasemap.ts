import type { StyleSpecification } from 'maplibre-gl';
import type { MapBaseMap } from '@/stores/mapStore';

/** OpenFreeMap basemap — light style matches SmartRayon UI */
export const MAPLIBRE_STYLE_URL =
  'https://tiles.openfreemap.org/styles/liberty';

const GOOGLE_RASTER_STYLES: Record<
  Extract<MapBaseMap, 'google_road' | 'google_satellite'>,
  string
> = {
  google_road: 'm',
  google_satellite: 's',
};

export function getMaplibreBasemapStyle(baseMap: MapBaseMap): string | StyleSpecification {
  if (baseMap === 'osm') return MAPLIBRE_STYLE_URL;

  const layerStyle = GOOGLE_RASTER_STYLES[baseMap as 'google_road' | 'google_satellite'] ?? 'm';

  return {
    version: 8,
    name: baseMap === 'google_satellite' ? 'Google Satellite' : 'Google Road',
    sources: {
      google: {
        type: 'raster',
        tiles: [
          `https://mt0.google.com/vt/lyrs=${layerStyle}&x={x}&y={y}&z={z}`,
          `https://mt1.google.com/vt/lyrs=${layerStyle}&x={x}&y={y}&z={z}`,
          `https://mt2.google.com/vt/lyrs=${layerStyle}&x={x}&y={y}&z={z}`,
          `https://mt3.google.com/vt/lyrs=${layerStyle}&x={x}&y={y}&z={z}`,
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'google-raster',
        type: 'raster',
        source: 'google',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

export { MAP_CLUSTER_MAX_ZOOM as MAP_3D_CLUSTER_MAX_ZOOM } from '@/lib/mapClusterConfig';
