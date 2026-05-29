import { useMemo } from 'react';
import { az } from '@/i18n/az';
import { ACTIVE_MAP_STATUSES, getStatusStyle } from '@/lib/incidentStyles';
import { countIncidentsByStatus } from '@/lib/mapIncidentCounts';
import type { MapIncident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  incidents: MapIncident[];
};

export function StatusLegend({ incidents }: Props) {
  const statusCounts = useMemo(
    () => countIncidentsByStatus(incidents, ACTIVE_MAP_STATUSES),
    [incidents],
  );

  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {az.map.statusesTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ul className="space-y-2">
          {ACTIVE_MAP_STATUSES.map((status) => {
            const s = getStatusStyle(status);
            return (
              <li
                key={status}
                className="flex items-center justify-between gap-2 text-xs text-foreground"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full border-2 ${s.markerClass}`}
                    style={{ backgroundColor: s.mapColor, borderColor: s.mapBorder }}
                  />
                  {s.label}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {statusCounts[status]}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
