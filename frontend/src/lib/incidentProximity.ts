/** Geographic helpers shared with backend incident-proximity rules. */

export function haversineMeters(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const r = 6371000;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) ** 2;
	return 2 * r * Math.asin(Math.sqrt(a));
}

export type IncidentMapCluster = {
	id: string;
	lat: number;
	lng: number;
	count: number;
	incidentIds: string[];
};
