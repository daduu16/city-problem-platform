import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { api } from '@/lib/api';
import { az } from '@/i18n/az';
import type { AssigneeAvailabilityCalendar } from '@/types';
import {
  AssigneeDayTimeline,
  minuteOnDateKey,
} from '@/components/incidents/AssigneeDayTimeline';
import {
  DateRangePicker,
  dateRangeFromStore,
  dateRangeToStore,
} from '@/components/ui/date-range-picker';
import { minutesToTimeInput } from '@/components/executors/availability-utils';
import {
  bakuLocalToUtc,
  clampDateKeyRangeEnd,
  enumerateDateKeys,
} from '@/lib/baku-date';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export const MAX_PLANNER_DAY_RANGE = 31;

type Props = {
  assigneeId: string;
  rangeFrom: string;
  rangeTo: string;
  onRangeChange: (from: string, to: string) => void;
  dailyStartMinute: number;
  dailyEndMinute: number;
  onDailyRangeChange: (startMinute: number, endMinute: number) => void;
};

export function AssigneeMultiDayTimeline({
  assigneeId,
  rangeFrom,
  rangeTo,
  onRangeChange,
  dailyStartMinute,
  dailyEndMinute,
  onDailyRangeChange,
}: Props) {
  const dateKeys = useMemo(
    () => enumerateDateKeys(rangeFrom, rangeTo),
    [rangeFrom, rangeTo],
  );
  const rangeTooLong = dateKeys.length > MAX_PLANNER_DAY_RANGE;

  const calendarQuery = useQuery({
    queryKey: [
      'incident-tasks',
      'multi-day-calendar',
      assigneeId,
      rangeFrom,
      rangeTo,
    ],
    queryFn: async () => {
      const res = await api.get<AssigneeAvailabilityCalendar>(
        `/assignees/${assigneeId}/availability/calendar`,
        { params: { from: rangeFrom, to: rangeTo } },
      );
      return res.data;
    },
    enabled: Boolean(assigneeId && rangeFrom && rangeTo && !rangeTooLong),
  });

  const daysByDate = useMemo(() => {
    const map = new Map(
      (calendarQuery.data?.days ?? []).map((d) => [d.date, d]),
    );
    return dateKeys.map(
      (date) =>
        map.get(date) ?? {
          date,
          dayOfWeek: new Date(`${date}T12:00:00+04:00`).getUTCDay(),
          hasDateOverride: false,
          status: 'closed' as const,
          effectiveWindows: [],
          unavailableBlocks: [],
          tasks: [],
        },
    );
  }, [calendarQuery.data?.days, dateKeys]);

  const rangeValue = dateRangeFromStore(rangeFrom, rangeTo);
  const dailyRangeValid = dailyEndMinute > dailyStartMinute;

  const handleRangePick = (range: DateRange | undefined) => {
    const { from, to } = dateRangeToStore(range);
    if (!from) return;
    const end = to ?? from;
    const clampedTo = clampDateKeyRangeEnd(from, end, MAX_PLANNER_DAY_RANGE);
    onRangeChange(from, clampedTo);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">{az.tasks.planDateRange}</Label>
        <DateRangePicker
          value={rangeValue}
          onChange={handleRangePick}
          placeholder={az.tasks.planDateRange}
          numberOfMonths={2}
        />
        <p className="text-[10px] text-muted-foreground">
          {az.tasks.planDateRangeHint}
        </p>
        {rangeTooLong && (
          <p className="text-xs text-destructive">
            {az.tasks.planDateRangeTooLong(MAX_PLANNER_DAY_RANGE)}
          </p>
        )}
        {!rangeTooLong && dateKeys.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {az.tasks.planDayCount(dateKeys.length)}
          </p>
        )}
      </div>

      {calendarQuery.isPending && !calendarQuery.data && (
        <div className="space-y-3" aria-busy="true">
          <p className="text-[10px] text-muted-foreground">
            {az.tasks.dayTimelineLoading}
          </p>
          {dateKeys.slice(0, 3).map((date) => (
            <div key={date} className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          ))}
        </div>
      )}

      {calendarQuery.isError && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{az.tasks.dayTimelineLoadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void calendarQuery.refetch()}
          >
            {az.errors.retry}
          </Button>
        </div>
      )}

      {calendarQuery.data && !rangeTooLong && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">
            {az.tasks.dayTimelineRangeHint}
          </p>
          <div className="max-h-[min(52vh,420px)] space-y-4 overflow-y-auto pr-1">
          {daysByDate.map((day) => (
            <AssigneeDayTimeline
              key={day.date}
              embedded
              hideLegend
              day={day}
              draftStart={
                dailyRangeValid
                  ? minuteOnDateKey(day.date, dailyStartMinute)
                  : undefined
              }
              draftEnd={
                dailyRangeValid
                  ? minuteOnDateKey(day.date, dailyEndMinute)
                  : undefined
              }
              onPickRange={onDailyRangeChange}
            />
          ))}
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-emerald-500/40" />
              {az.tasks.legendWorkHours}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-red-500" />
              {az.tasks.legendFixedTask}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm border border-amber-500 bg-amber-400/60" />
              {az.tasks.legendWindowTask}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm border-2 border-primary bg-primary/30" />
              {az.tasks.legendDraft}
            </span>
          </div>
        </div>
      )}

      {dailyRangeValid && dateKeys.length > 0 && !rangeTooLong && (
        <p className="rounded-md bg-emerald-500/10 px-2 py-1.5 text-center text-[11px] font-medium text-emerald-900 dark:text-emerald-100">
          {az.tasks.selectedMultiDayRange(
            dateKeys.length,
            minutesToTimeInput(dailyStartMinute),
            minutesToTimeInput(dailyEndMinute),
            dateKeys.length * (dailyEndMinute - dailyStartMinute),
          )}
        </p>
      )}
    </div>
  );
}

export function syncUtcRangeFromDailyPlan(
  rangeFrom: string,
  rangeTo: string,
  dailyStartMinute: number,
  dailyEndMinute: number,
): { startsAt: Date; endsAt: Date } {
  return {
    startsAt: bakuLocalToUtc(rangeFrom, dailyStartMinute),
    endsAt: bakuLocalToUtc(rangeTo, dailyEndMinute),
  };
}
