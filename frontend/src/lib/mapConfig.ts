import { MAP_DISTRICT_COLOR } from '@/lib/mapPalette';

/** Narimanov district (Baku) — demo map center */
/** Default zoom ≥ minZoomForBuildings so 3D extrusions are visible. */
export const NARIMANOV_CENTER = {
  lat: 40.4093,
  lng: 49.8531,
  zoom: 15,
} as const;

/** Minimal base map: roads/water only, no place or street labels (no API key) */
export const BASE_MAP_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
export const BASE_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * 2D Leaflet only: CSS invert on tile images (not markers/overlays).
 * Alternative without filter: dark_nolabels tile URL from CARTO.
 */
export const BASE_MAP_2D_INVERT = true;
export const BASE_MAP_2D_TILE_CLASS = BASE_MAP_2D_INVERT ? 'map-basemap-invert' : '';

export const MAP_3D_VIEW = {
  pitch: 60,
  bearing: -28,
  minPitch: 0,
  maxPitch: 85,
  minZoomForBuildings: 14,
} as const;

/** District boundary highlight (2D + 3D) */
export const DISTRICT_HIGHLIGHT = {
  color: MAP_DISTRICT_COLOR,
  fillOpacity: 0.12,
  lineWidth: 2.5,
} as const;

export type MapRegionKey = 'baku' | 'azerbaijan';

export interface MapRegionConfig {
  label: string;
  southwest: { lat: number; lng: number };
  northeast: { lat: number; lng: number };
  minZoom: number;
  maxZoom: number;
}

/** Pan/zoom limits — tiles load only inside this box */
export const MAP_REGIONS: Record<MapRegionKey, MapRegionConfig> = {
  baku: {
    label: 'Bakı',
    southwest: { lat: 40.18, lng: 49.58 },
    northeast: { lat: 40.62, lng: 50.18 },
    minZoom: 10,
    maxZoom: 20,
  },
  azerbaijan: {
    label: 'Azərbaycan',
    southwest: { lat: 38.4, lng: 44.75 },
    northeast: { lat: 41.95, lng: 50.65 },
    minZoom: 6,
    maxZoom: 20,
  },
};

export const ACTIVE_MAP_REGION: MapRegionKey = 'baku';

export function getActiveMapRegion(): MapRegionConfig {
  return MAP_REGIONS[ACTIVE_MAP_REGION];
}

export function getActiveMapRegionBoundsLngLat(): [
  [number, number],
  [number, number],
] {
  const r = getActiveMapRegion();
  return [
    [r.southwest.lng, r.southwest.lat],
    [r.northeast.lng, r.northeast.lat],
  ];
}
