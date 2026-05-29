import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { getActiveMapRegion, getActiveMapRegionBoundsLngLat } from '@/lib/mapConfig';

/** Enforces regional pan/zoom limits on the MapLibre map. */
export function MapRegionLimits3D() {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const region = getActiveMapRegion();
    const bounds = getActiveMapRegionBoundsLngLat();

    map.setMaxBounds(bounds);
    map.setMinZoom(region.minZoom);
    map.setMaxZoom(region.maxZoom);

    const clampView = () => {
      const center = map.getCenter();
      const [[west, south], [east, north]] = bounds;
      const lng = Math.min(Math.max(center.lng, west), east);
      const lat = Math.min(Math.max(center.lat, south), north);
      if (lng !== center.lng || lat !== center.lat) {
        map.setCenter([lng, lat]);
      }
    };

    map.on('moveend', clampView);
    map.on('zoomend', clampView);

    return () => {
      map.off('moveend', clampView);
      map.off('zoomend', clampView);
    };
  }, [mapRef]);

  return null;
}
