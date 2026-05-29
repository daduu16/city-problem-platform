import { useMemo } from 'react';
import { az } from '@/i18n/az';
import { ALL_INCIDENT_TYPES, getTypeStyle } from '@/lib/incidentTypeStyles';
import { countIncidentsByType } from '@/lib/mapIncidentCounts';
import type { MapIncident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  incidents: MapIncident[];
};

export function TypeLegend({ incidents }: Props) {
  const typeCounts = useMemo(
    () => countIncidentsByType(incidents),
    [incidents],
  );

  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {az.map.typesTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ul className="space-y-2">
          {ALL_INCIDENT_TYPES.map((type) => {
            const s = getTypeStyle(type);
            return (
              <li
                key={type}
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
                  {typeCounts[type]}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
