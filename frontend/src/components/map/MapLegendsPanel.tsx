import { useMemo } from 'react';
import { useMapStore } from '@/stores/mapStore';
import type { MapIncident } from '@/types';
import { StatusLegend } from '@/components/map/StatusLegend';
import { TypeLegend } from '@/components/map/TypeLegend';
import { DistrictZonesLegend } from '@/components/map/DistrictZonesLegend';
import { PlaceTypeLegend } from '@/components/map/PlaceTypeLegend';
import { useFilteredMapIncidents } from '@/hooks/useFilteredMapIncidents';
import { useNarimanovRayon } from '@/hooks/useNarimanovRayon';
import { filterIncidentsByDateRange } from '@/lib/filterIncidentsByDateRange';
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
  const showPlaces = useMapStore((s) => s.showPlaces);
  const mapDateFrom = useMapStore((s) => s.mapDateFrom);
  const mapDateTo = useMapStore((s) => s.mapDateTo);
  const { data: rayon } = useNarimanovRayon();
  const visibleIncidents = useFilteredMapIncidents(incidents, rayon?.feature);

  const incidentsForStatusCounts = useMemo(
    () => filterIncidentsByDateRange(incidents, mapDateFrom, mapDateTo),
    [incidents, mapDateFrom, mapDateTo],
  );

  return (
    <div
      className="pointer-events-none absolute left-4 top-4 flex max-h-[calc(100%-2rem)] w-56 flex-col gap-2 overflow-y-auto"
      style={{ zIndex: MAP_UI_Z_INDEX }}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <DistrictZonesLegend incidents={incidents} />
        <StatusLegend incidents={incidentsForStatusCounts} />
        {variant === 'archived' && <TypeLegend incidents={visibleIncidents} />}
        {showPlacesLayer && showPlaces && <PlaceTypeLegend />}
      </div>
    </div>
  );
}
