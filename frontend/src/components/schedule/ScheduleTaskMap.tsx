import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ScheduleTaskView } from '@/types';
import {
  NARIMANOV_CENTER,
  getLeafletBasemapConfig,
} from '@/lib/mapConfig';
import { taskMapCoords } from '@/lib/scheduleTasks';
import { az } from '@/i18n/az';
import { formatBakuDateTime } from '@/lib/baku-date';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Pin = {
  task: ScheduleTaskView;
  lat: number;
  lng: number;
};

function FitTaskBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      map.setView([NARIMANOV_CENTER.lat, NARIMANOV_CENTER.lng], NARIMANOV_CENTER.zoom);
      return;
    }
    if (positions.length === 1) {
      map.setView(positions[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 16 });
  }, [map, positions]);

  return null;
}

type Props = {
  tasks: ScheduleTaskView[];
  className?: string;
};

export function ScheduleTaskMap({ tasks, className }: Props) {
  const basemap = getLeafletBasemapConfig('osm');

  const pins = useMemo<Pin[]>(() => {
    const result: Pin[] = [];
    for (const task of tasks) {
      const coords = taskMapCoords(task);
      if (!coords) continue;
      result.push({ task, ...coords });
    }
    return result;
  }, [tasks]);

  const positions = useMemo(
    () => pins.map((p) => [p.lat, p.lng] as [number, number]),
    [pins],
  );

  return (
    <div
      className={cn('relative', className)}
      style={{ minHeight: 320 }}
    >
      <MapContainer
        center={[NARIMANOV_CENTER.lat, NARIMANOV_CENTER.lng]}
        zoom={NARIMANOV_CENTER.zoom}
        className="h-full min-h-[320px] w-full rounded-lg border border-border"
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution={basemap.attribution}
          url={basemap.url}
          subdomains={basemap.subdomains}
        />
        <FitTaskBounds positions={positions} />
        {pins.map((pin) => (
          <Marker key={pin.task.id} position={[pin.lat, pin.lng]}>
            <Popup>
              <div className="min-w-[180px] space-y-1 text-sm">
                <p className="font-semibold">{pin.task.title}</p>
                {pin.task.incident?.title && (
                  <p className="text-muted-foreground">{pin.task.incident.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatBakuDateTime(new Date(pin.task.startsAt))}
                </p>
                {pin.task.incident?.address && (
                  <p className="text-xs">{pin.task.incident.address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {pins.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
          {az.schedule.noMapPoints}
        </p>
      )}
    </div>
  );
}
