import { useMapStore } from '@/stores/mapStore';
import type { MapIncident } from '@/types';
import { StatusLegend } from '@/components/map/StatusLegend';
import { TypeLegend } from '@/components/map/TypeLegend';
import { BuildingTypeLegend } from '@/components/map/BuildingTypeLegend';
import { PlaceTypeLegend } from '@/components/map/PlaceTypeLegend';
import { useFilteredMapIncidents } from '@/hooks/useFilteredMapIncidents';
import { MAP_UI_Z_INDEX } from '@/lib/mapZIndex';

type MapLegendVariant = 'active' | 'archived';

type Props = {
  incidents: MapIncident[];
  showPlacesLayer?: boolean;
  variant?: MapLegendVariant;
};

/** Incident and building legends — top-left of the map. */
export function MapLegendsPanel({
  incidents,
  showPlacesLayer = true,
  variant = 'active',
}: Props) {
  const viewMode = useMapStore((s) => s.viewMode);
  const showPlaces = useMapStore((s) => s.showPlaces);
  const visibleIncidents = useFilteredMapIncidents(incidents);

  return (
    <div
      className="pointer-events-none absolute left-4 top-4 flex max-h-[calc(100%-2rem)] w-56 flex-col gap-2 overflow-y-auto"
      style={{ zIndex: MAP_UI_Z_INDEX }}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        {variant === 'archived' ? (
          <TypeLegend incidents={visibleIncidents} />
        ) : (
          <StatusLegend incidents={visibleIncidents} />
        )}
        {showPlacesLayer && showPlaces && <PlaceTypeLegend />}
        {showPlacesLayer && viewMode === '3d' && <BuildingTypeLegend />}
      </div>
    </div>
  );
}
