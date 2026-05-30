import { useMemo } from 'react';
import { ACTIVE_MAP_STATUSES, getStatusStyle } from '@/lib/incidentStyles';
import { countIncidentsByStatus } from '@/lib/mapIncidentCounts';
import { useMapStore } from '@/stores/mapStore';
import type { MapIncident } from '@/types';
import { MAP_GLASS_PANEL_CLASS } from '@/lib/mapGlass';
import { MAP_PANEL_TITLE_CLASS } from '@/lib/mapPanelStyles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { az } from '@/i18n/az';

type Props = {
  /** Date-filtered incidents — counts do not change when toggling visibility. */
  incidents: MapIncident[];
};

export function StatusLegend({ incidents }: Props) {
  const { visibleStatuses, toggleStatus } = useMapStore();

  const statusCounts = useMemo(
    () => countIncidentsByStatus(incidents, ACTIVE_MAP_STATUSES),
    [incidents],
  );

  return (
    <Card className={`w-full ${MAP_GLASS_PANEL_CLASS}`}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className={MAP_PANEL_TITLE_CLASS}>
          {az.map.statusesTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ul className="space-y-2">
          {ACTIVE_MAP_STATUSES.map((status) => {
            const s = getStatusStyle(status);
            const checked = visibleStatuses[status] === true;
            const count = statusCounts[status] ?? 0;
            return (
              <li key={status} className="flex items-center gap-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={checked}
                  onCheckedChange={() => toggleStatus(status)}
                  className="shrink-0"
                />
                <Label
                  htmlFor={`status-${status}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-xs font-normal"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full border-2 ${s.markerClass}`}
                      style={{
                        backgroundColor: s.mapColor,
                        borderColor: s.mapBorder,
                      }}
                    />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span
                    className="shrink-0 tabular-nums text-muted-foreground"
                    title={az.map.categoryCountHint}
                  >
                    {count}
                  </span>
                </Label>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
