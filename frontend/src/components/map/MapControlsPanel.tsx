import { MapControls } from '@/components/map/MapControls';
import { MAP_UI_Z_INDEX } from '@/lib/mapZIndex';
import type { MapIncident } from '@/types';
import { useFilteredMapIncidents } from '@/hooks/useFilteredMapIncidents';

type Props = {
  incidents: MapIncident[];
  showPlacesToggle?: boolean;
};

/** Layer toggles and 2D/3D mode — top-right of the map. */
export function MapControlsPanel({
  incidents,
  showPlacesToggle = true,
}: Props) {
  const visibleIncidents = useFilteredMapIncidents(incidents);

  return (
    <div
      className="pointer-events-none absolute right-4 top-4 w-56"
      style={{ zIndex: MAP_UI_Z_INDEX }}
    >
      <div className="pointer-events-auto">
        <MapControls
          incidents={visibleIncidents}
          showPlacesToggle={showPlacesToggle}
        />
      </div>
    </div>
  );
}
