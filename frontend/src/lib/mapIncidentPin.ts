import type { MapIncident } from '@/types';

export type MapIncidentPin = {
	incident: MapIncident;
	lat: number;
	lng: number;
};

export function incidentsToMapPins(incidents: MapIncident[]): MapIncidentPin[] {
	return incidents.map((incident) => ({
		incident,
		lat: incident.lat,
		lng: incident.lng,
	}));
}
