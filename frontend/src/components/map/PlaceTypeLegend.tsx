import { useMapStore } from '@/stores/mapStore';
import {
  PLACE_LEGEND_ITEMS,
  getPlaceTypeLabel,
} from '@/lib/placeTypeStyles';
import { az } from '@/i18n/az';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function PlaceTypeLegend() {
  const { visiblePlaceTypes, togglePlaceType } = useMapStore();

  return (
    <Card className="w-full border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {az.map.placesTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-48 overflow-y-auto p-3 pt-0">
        <ul className="space-y-1">
          {PLACE_LEGEND_ITEMS.map(({ type, color }) => {
            const checked = visiblePlaceTypes[type] !== false;
            return (
              <li key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`place-type-${type}`}
                  checked={checked}
                  onCheckedChange={() => togglePlaceType(type)}
                  className="shrink-0"
                />
                <Label
                  htmlFor={`place-type-${type}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-xs font-normal"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/40"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{getPlaceTypeLabel(type)}</span>
                </Label>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
