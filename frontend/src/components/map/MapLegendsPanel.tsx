import { useMapStore } from '@/stores/mapStore';
import { StatusLegend } from '@/components/map/StatusLegend';
import { BuildingTypeLegend } from '@/components/map/BuildingTypeLegend';

/** Incident and building legends — top-left of the map. */
export function MapLegendsPanel() {
  const viewMode = useMapStore((s) => s.viewMode);

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex max-h-[calc(100%-2rem)] w-56 flex-col gap-2 overflow-y-auto">
      <div className="pointer-events-auto flex flex-col gap-2">
        <StatusLegend />
        {viewMode === '3d' && <BuildingTypeLegend />}
      </div>
    </div>
  );
}
