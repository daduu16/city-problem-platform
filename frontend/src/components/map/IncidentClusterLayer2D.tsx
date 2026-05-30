import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { IncidentMapCluster } from '@/lib/incidentProximity';
import { MAP_DISTRICT_COLOR } from '@/lib/mapPalette';

interface Props {
  clusters: IncidentMapCluster[];
  onClusterClick: (cluster: IncidentMapCluster) => void;
}

function clusterIcon(count: number) {
  const size = count < 10 ? 36 : count < 30 ? 42 : 48;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      border-radius:50%;background:${MAP_DISTRICT_COLOR};
      color:#fff;font-weight:700;font-size:13px;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);
    ">${count}</div>`,
    className: 'incident-discriminative-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function IncidentClusterLayer2D({ clusters, onClusterClick }: Props) {
  return (
    <>
      {clusters.map((cluster) => (
        <Marker
          key={cluster.id}
          position={[cluster.lat, cluster.lng]}
          icon={clusterIcon(cluster.count)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onClusterClick(cluster);
            },
          }}
        />
      ))}
    </>
  );
}
