import { endOfDay, parseISO, startOfDay } from 'date-fns';
import type { MapIncident } from '@/types';

/** Inclusive local-day filter on `createdAt`. Empty bounds = no filter. */
export function filterIncidentsByDateRange(
  incidents: MapIncident[],
  from: string | null,
  to: string | null,
): MapIncident[] {
  if (!from && !to) return incidents;

  const rangeStart = from ? startOfDay(parseISO(from)) : null;
  const rangeEnd = to ? endOfDay(parseISO(to)) : null;

  return incidents.filter((incident) => {
    const at = parseISO(incident.createdAt);
    if (rangeStart && at < rangeStart) return false;
    if (rangeEnd && at > rangeEnd) return false;
    return true;
  });
}
