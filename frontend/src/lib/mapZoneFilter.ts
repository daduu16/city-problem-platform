import {
	classifyIncidentsByDistrictZone,
	type DistrictZoneId,
} from '@/lib/narimanovZones';
import type { MapIncident } from '@/types';

const ZONE_IDS: DistrictZoneId[] = ['A', 'B', 'C', 'D'];

export function filterIncidentsByVisibleZones(
	incidents: MapIncident[],
	districtFeature: GeoJSON.Feature<GeoJSON.Polygon> | undefined,
	visibleZones: Record<DistrictZoneId, boolean>,
): MapIncident[] {
	if (!districtFeature) return incidents;

	const allVisible = ZONE_IDS.every((id) => visibleZones[id] !== false);
	if (allVisible) return incidents;

	const noneVisible = ZONE_IDS.every((id) => visibleZones[id] === false);
	if (noneVisible) return [];

	const zoneIds = classifyIncidentsByDistrictZone(incidents, districtFeature);
	const out: MapIncident[] = [];
	for (let i = 0; i < incidents.length; i++) {
		if (visibleZones[zoneIds[i]] !== false) {
			out.push(incidents[i]);
		}
	}
	return out;
}
