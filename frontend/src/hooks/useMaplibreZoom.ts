import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

/** Current MapLibre zoom — updates on zoom / move. */
export function useMaplibreZoom(fallback = 15): number {
  const { current: mapRef } = useMap();
  const [zoom, setZoom] = useState(fallback);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const update = () => setZoom(map.getZoom());
    update();
    map.on('zoom', update);
    map.on('moveend', update);

    return () => {
      map.off('zoom', update);
      map.off('moveend', update);
    };
  }, [mapRef]);

  return zoom;
}
