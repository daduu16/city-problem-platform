import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getActiveMapRegion, getActiveMapRegionBoundsLngLat } from '@/lib/mapConfig';

/** Enforces regional pan/zoom limits on the Leaflet map. */
export function MapRegionLimits2D() {
  const map = useMap();

  useEffect(() => {
    const region = getActiveMapRegion();
    const [[west, south], [east, north]] = getActiveMapRegionBoundsLngLat();
    const bounds = L.latLngBounds(
      L.latLng(south, west),
      L.latLng(north, east),
    );

    map.setMaxBounds(bounds);
    map.setMinZoom(region.minZoom);
    map.setMaxZoom(region.maxZoom);

    const clampView = () => {
      map.panInsideBounds(bounds, { animate: false });
    };

    map.on('moveend', clampView);
    map.on('zoomend', clampView);
    clampView();

    return () => {
      map.off('moveend', clampView);
      map.off('zoomend', clampView);
    };
  }, [map]);

  return null;
}
