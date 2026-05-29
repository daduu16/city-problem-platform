import { useEffect, useState } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { MapIncident } from '@/types';
import { statusMarkerHtml } from '@/lib/incidentStyles';
import { typeMarkerHtml } from '@/lib/incidentTypeStyles';
import type { IncidentMarkerMode } from '@/stores/mapStore';

const INCIDENTS_SOURCE = 'incidents';

function useVisibleIncidentIds(
  map: MaplibreMap | undefined,
  incidents: MapIncident[],
  showClusters: boolean,
) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(
    () => new Set(incidents.map((i) => i.id)),
  );

  useEffect(() => {
    const all = new Set(incidents.map((i) => i.id));

    if (!map || !showClusters) {
      setVisibleIds(all);
      return;
    }

    const update = () => {
      if (!map.getSource(INCIDENTS_SOURCE)) {
        setVisibleIds(all);
        return;
      }

      const next = new Set<string>();
      for (const f of map.querySourceFeatures(INCIDENTS_SOURCE)) {
        if (f.properties?.cluster) continue;
        const id = f.properties?.id;
        if (id != null) next.add(String(id));
      }

      setVisibleIds(next.size > 0 ? next : all);
    };

    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    map.on('sourcedata', update);

    return () => {
      map.off('moveend', update);
      map.off('zoomend', update);
      map.off('sourcedata', update);
    };
  }, [map, showClusters, incidents]);

  return visibleIds;
}

interface Props {
  incidents: MapIncident[];
  markerMode?: IncidentMarkerMode;
  showClusters: boolean;
  onIncidentClick: (id: string) => void;
}

/** DOM markers drawn above the 3D canvas (not occluded by buildings). */
export function IncidentMarkers3D({
  incidents,
  markerMode = 'status',
  showClusters,
  onIncidentClick,
}: Props) {
  const { current: mapRef } = useMap();
  const visibleIds = useVisibleIncidentIds(mapRef?.getMap(), incidents, showClusters);

  return (
    <>
      {incidents
        .filter((i) => visibleIds.has(i.id))
        .map((i) => (
          <Marker
            key={i.id}
            longitude={i.lng}
            latitude={i.lat}
            anchor="center"
            className="map-incident-marker-3d"
            style={{ zIndex: 10 }}
            onClick={(evt) => {
              evt.originalEvent.stopPropagation();
              onIncidentClick(i.id);
            }}
          >
            <div
              className="incident-marker-wrapper"
              dangerouslySetInnerHTML={{
                __html:
                  markerMode === 'type'
                    ? typeMarkerHtml(i.type)
                    : statusMarkerHtml(i.status),
              }}
            />
          </Marker>
        ))}
    </>
  );
}
