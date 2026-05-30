import { useMap } from 'react-map-gl/maplibre';
import type { MapIncidentPin } from '@/lib/mapIncidentPin';
import type { IncidentMarkerMode } from '@/stores/mapStore';
import { useIncidentSupercluster } from '@/hooks/useIncidentSupercluster';
import { IncidentClusterMarkers3D } from '@/components/map/IncidentClusterMarkers3D';
import { IncidentMarkers3D } from '@/components/map/IncidentMarkers3D';

interface Props {
	pins: MapIncidentPin[];
	markerMode?: IncidentMarkerMode;
	showClusters: boolean;
	onPinClick: (pin: MapIncidentPin) => void;
}

/** Incident pins + DOM clusters — must render inside `<Map>`. */
export function IncidentMapMarkers3D({
	pins,
	markerMode,
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
				markerMode={markerMode}
				showClusters={showClusters}
				clusters={clusters}
				clusterReady={clusterReady}
				onPinClick={onPinClick}
			/>
		</>
	);
}
