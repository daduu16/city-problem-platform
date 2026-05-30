import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { createIncidentDraftMarkerHtml } from '@/lib/createIncidentMarker';
import { useMapStore } from '@/stores/mapStore';

const draftIcon = L.divIcon({
	className: 'create-incident-marker-wrapper',
	html: createIncidentDraftMarkerHtml(),
	iconSize: [24, 24],
	iconAnchor: [12, 12],
});

export function CreateIncidentDraftMarker2D() {
	const location = useMapStore((s) => s.incidentCreateLocation);
	const mode = useMapStore((s) => s.incidentCreateMode);

	if (!location || mode === false) return null;

	return (
		<Marker
			position={[location.lat, location.lng]}
			icon={draftIcon}
			zIndexOffset={2000}
			interactive={false}
		/>
	);
}
