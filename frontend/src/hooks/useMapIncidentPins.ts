import { useMemo } from 'react';
import { incidentsToMapPins } from '@/lib/mapIncidentPin';
import type { MapIncident } from '@/types';

/** One map pin per incident; multiple citizen reports live on the same incident. */
export function useMapIncidentPins(incidents: MapIncident[]) {
	return useMemo(() => incidentsToMapPins(incidents), [incidents]);
}
