import { az } from '@/i18n/az';
import { useMapStore } from '@/stores/mapStore';
import { Button } from '@/components/ui/button';
import {
  DateRangePicker,
  dateRangeFromStore,
  dateRangeToStore,
} from '@/components/ui/date-range-picker';

export function MapDateRangePicker() {
  const mapDateFrom = useMapStore((s) => s.mapDateFrom);
  const mapDateTo = useMapStore((s) => s.mapDateTo);
  const setMapDateFrom = useMapStore((s) => s.setMapDateFrom);
  const setMapDateTo = useMapStore((s) => s.setMapDateTo);
  const clearMapDateRange = useMapStore((s) => s.clearMapDateRange);

  const hasRange = Boolean(mapDateFrom || mapDateTo);
  const value = dateRangeFromStore(mapDateFrom, mapDateTo);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <DateRangePicker
        value={value}
        placeholder={az.map.pickDateRange}
        className="w-[min(100%,17rem)] sm:w-[17rem]"
        onChange={(range) => {
          const next = dateRangeToStore(range);
          setMapDateFrom(next.from);
          setMapDateTo(next.to);
        }}
      />
      {hasRange && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={clearMapDateRange}
        >
          {az.map.clearDateRange}
        </Button>
      )}
    </div>
  );
}
