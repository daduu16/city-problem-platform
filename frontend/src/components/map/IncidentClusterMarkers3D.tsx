import { Marker } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap } from 'maplibre-gl';
import {
	incidentClusterSizeClass,
	type IncidentClusterFeature,
	type IncidentClusterGroupProps,
} from '@/lib/mapClusterUtils';
import type { useIncidentSupercluster } from '@/hooks/useIncidentSupercluster';

interface Props {
	clusters: IncidentClusterFeature[];
	index: ReturnType<typeof useIncidentSupercluster>['index'];
	map: MaplibreMap | undefined;
}

export function IncidentClusterMarkers3D({ clusters, index, map }: Props) {
	const clusterFeatures = clusters.filter(
		(f): f is IncidentClusterFeature & { properties: IncidentClusterGroupProps } =>
			Boolean(f.properties.cluster),
	);

	return (
		<>
			{clusterFeatures.map((cluster) => {
				const [lng, lat] = cluster.geometry.coordinates;
				const count = cluster.properties.point_count;
				const clusterId = cluster.properties.cluster_id;
				const sizeClass = incidentClusterSizeClass(count);

				return (
					<Marker
						key={`cluster-${clusterId}`}
						longitude={lng}
						latitude={lat}
						anchor="center"
						className="map-incident-cluster-3d"
						style={{ zIndex: 15 }}
						onClick={(evt) => {
							evt.originalEvent.stopPropagation();
							if (!map) return;
							const expansionZoom = index.getClusterExpansionZoom(clusterId);
							map.easeTo({
								center: [lng, lat],
								zoom: Math.min(expansionZoom, map.getMaxZoom()),
								duration: 400,
							});
						}}
					>
						<div className={sizeClass}>
							<div>
								<span>{count}</span>
							</div>
						</div>
					</Marker>
				);
			})}
		</>
	);
}
