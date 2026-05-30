import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '@/stores/mapStore';

/** Captures map clicks while the user is picking a location for a new incident. */
export function MapLocationPickHandler2D() {
	const mode = useMapStore((s) => s.incidentCreateMode);
	const setLocation = useMapStore((s) => s.setIncidentCreateLocation);
	const map = useMap();

	const enabled = mode === 'pick';

	useMapEvents({
		click(e) {
			if (!enabled) return;
			setLocation(e.latlng.lat, e.latlng.lng);
		},
	});

	useEffect(() => {
		if (!enabled) return;
		const container = map.getContainer();
		const prev = container.style.cursor;
		container.style.cursor = 'crosshair';
		return () => {
			container.style.cursor = prev;
		};
	}, [enabled, map]);

	return null;
}
