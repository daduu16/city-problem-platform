import { useMemo } from 'react';
import { az } from '@/i18n/az';
import { MapMarkerChip } from '@/components/map/MapMarkerChip';
import { ALL_INCIDENT_TYPES, getTypeStyle } from '@/lib/incidentTypeStyles';
import { countIncidentsByType } from '@/lib/mapIncidentCounts';
import type { MapIncident } from '@/types';
import { MAP_GLASS_PANEL_CLASS } from '@/lib/mapGlass';
import { MAP_PANEL_TITLE_CLASS } from '@/lib/mapPanelStyles';
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
    <Card className={`w-full ${MAP_GLASS_PANEL_CLASS}`}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className={MAP_PANEL_TITLE_CLASS}>
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
                  <MapMarkerChip
                    mapColor={s.mapColor}
                    mapBorder={s.mapBorder}
                    icon={s.icon}
                    size={20}
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
