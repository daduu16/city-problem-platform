import { MapControls } from '@/components/map/MapControls';

/** Layer toggles and 2D/3D mode — top-right of the map. */
export function MapControlsPanel() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-[1000] w-56">
      <div className="pointer-events-auto">
        <MapControls />
      </div>
    </div>
  );
}
