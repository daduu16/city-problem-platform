import { useMemo } from 'react';
import { MapControls } from '@/components/map/MapControls';
import { MAP_UI_Z_INDEX } from '@/lib/mapZIndex';
import { filterIncidentsByDateRange } from '@/lib/filterIncidentsByDateRange';
import { useMapStore } from '@/stores/mapStore';
import type { MapIncident } from '@/types';

type Props = {
  incidents: MapIncident[];
  showPlacesToggle?: boolean;
};

/** Category toggles and 2D/3D mode — compact panel on the right. */
export function MapControlsPanel({
  incidents,
  showPlacesToggle = true,
}: Props) {
  const mapDateFrom = useMapStore((s) => s.mapDateFrom);
  const mapDateTo = useMapStore((s) => s.mapDateTo);

  const incidentsForCounts = useMemo(
    () => filterIncidentsByDateRange(incidents, mapDateFrom, mapDateTo),
    [incidents, mapDateFrom, mapDateTo],
  );

  return (
    <div
      className="pointer-events-none absolute right-4 top-4 flex w-60 max-h-[min(36rem,calc(100vh-5.5rem))] flex-col"
      style={{ zIndex: MAP_UI_Z_INDEX }}
    >
      <div className="pointer-events-auto max-h-full min-h-0 overflow-hidden">
        <MapControls
          incidents={incidentsForCounts}
          showPlacesToggle={showPlacesToggle}
        />
      </div>
    </div>
  );
}
