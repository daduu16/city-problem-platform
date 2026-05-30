import { Marker } from 'react-map-gl/maplibre';
import { createIncidentDraftMarkerHtml } from '@/lib/createIncidentMarker';
import { useMapStore } from '@/stores/mapStore';

export function CreateIncidentDraftMarker3D() {
	const location = useMapStore((s) => s.incidentCreateLocation);
	const mode = useMapStore((s) => s.incidentCreateMode);

	if (!location || mode === false) return null;

	return (
		<Marker
			longitude={location.lng}
			latitude={location.lat}
			anchor="center"
			style={{ zIndex: 20 }}
		>
			<div
				className="create-incident-marker-wrapper"
				dangerouslySetInnerHTML={{
					__html: createIncidentDraftMarkerHtml(),
				}}
			/>
		</Marker>
	);
}
