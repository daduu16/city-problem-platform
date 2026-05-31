import { useMap } from 'react-map-gl/maplibre';
import type { MapIncidentPin } from '@/lib/mapIncidentPin';
import { useIncidentSupercluster } from '@/hooks/useIncidentSupercluster';
import { IncidentClusterMarkers3D } from '@/components/map/IncidentClusterMarkers3D';
import { IncidentMarkers3D } from '@/components/map/IncidentMarkers3D';

interface Props {
	pins: MapIncidentPin[];
	showClusters: boolean;
	onPinClick: (pin: MapIncidentPin) => void;
}

/** Incident pins + DOM clusters — must render inside `<Map>`. */
export function IncidentMapMarkers3D({
	pins,
	showClusters,
	onPinClick,
}: Props) {
	const { current: mapRef } = useMap();
	const { clusters, clusterReady, index } = useIncidentSupercluster(
		pins,
		showClusters,
	);

	return (
		<>
			{showClusters && (
				<IncidentClusterMarkers3D
					clusters={clusters}
					index={index}
					map={mapRef?.getMap()}
				/>
			)}
			<IncidentMarkers3D
				pins={pins}
				showClusters={showClusters}
				clusters={clusters}
				clusterReady={clusterReady}
				onPinClick={onPinClick}
			/>
		</>
	);
}
