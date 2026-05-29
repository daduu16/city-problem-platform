import { az } from '@/i18n/az';
import { ALL_STATUSES, getStatusStyle } from '@/lib/incidentStyles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatusLegend() {
  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {az.map.statusesTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ul className="space-y-2">
          {ALL_STATUSES.map((status) => {
            const s = getStatusStyle(status);
            return (
              <li key={status} className="flex items-center gap-2 text-xs text-foreground">
                <span
                  className={`h-3 w-3 shrink-0 rounded-full border-2 ${s.markerClass}`}
                  style={{ backgroundColor: s.color, borderColor: s.border }}
                />
                {s.label}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
