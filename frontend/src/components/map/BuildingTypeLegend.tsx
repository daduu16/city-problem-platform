import { az } from '@/i18n/az';
import {
  BUILDING_LEGEND_ITEMS,
  getBuildingLegendLabel,
} from '@/lib/buildingTypeStyles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function BuildingTypeLegend() {
  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {az.map.buildingsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-36 overflow-y-auto p-3 pt-0">
        <ul className="space-y-1.5">
          {BUILDING_LEGEND_ITEMS.map(({ id, color }) => (
            <li key={id} className="flex items-center gap-2 text-xs text-foreground">
              <span
                className="h-3 w-3 shrink-0 rounded-sm border border-white/30"
                style={{ backgroundColor: color }}
              />
              {getBuildingLegendLabel(id)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
