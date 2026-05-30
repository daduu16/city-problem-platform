import { useMemo } from 'react';
import type { MapIncident } from '@/types';
import { filterIncidentsByDateRange } from '@/lib/filterIncidentsByDateRange';
import { isIncidentCategoryVisible } from '@/lib/mapIncidentCategory';
import { filterIncidentsByVisibleZones } from '@/lib/mapZoneFilter';
import { useMapStore } from '@/stores/mapStore';

/** Incidents visible for date range, category/status, and district zone toggles. */
export function useFilteredMapIncidents(
  incidents: MapIncident[],
  districtFeature?: GeoJSON.Feature<GeoJSON.Polygon>,
) {
  const visibleCategories = useMapStore((s) => s.visibleCategories);
  const visibleStatuses = useMapStore((s) => s.visibleStatuses);
  const visibleZones = useMapStore((s) => s.visibleZones);
  const mapDateFrom = useMapStore((s) => s.mapDateFrom);
  const mapDateTo = useMapStore((s) => s.mapDateTo);

  return useMemo(() => {
    const byDate = filterIncidentsByDateRange(incidents, mapDateFrom, mapDateTo);
    const isArchivedMap =
      byDate.length > 0 && byDate.every((i) => i.status === 'ARCHIVED');

    const byCategoryAndStatus = byDate.filter((i) => {
      if (!isIncidentCategoryVisible(i, visibleCategories)) return false;
      if (isArchivedMap) return true;
      return visibleStatuses[i.status] === true;
    });

    return filterIncidentsByVisibleZones(
      byCategoryAndStatus,
      districtFeature,
      visibleZones,
    );
  }, [
    incidents,
    visibleCategories,
    visibleStatuses,
    visibleZones,
    mapDateFrom,
    mapDateTo,
    districtFeature,
  ]);
}
