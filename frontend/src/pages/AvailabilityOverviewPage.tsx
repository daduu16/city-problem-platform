import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { CalendarRange, X } from 'lucide-react';
import { api } from '@/lib/api';
import { az } from '@/i18n/az';
import type { AvailabilityOverview } from '@/types';
import { AvailabilityOverviewMatrix } from '@/components/executors/AvailabilityOverviewMatrix';
import { ExecutorAvailabilityTab } from '@/components/executors/ExecutorAvailabilityTab';
import {
  addDaysToDateKey,
  clampRangeEnd,
  MAX_AVAILABILITY_RANGE_DAYS,
  todayDateKey,
} from '@/components/executors/availability-utils';
import { AVAILABILITY_STATUS_CLASS } from '@/components/executors/availability-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DateRangePicker,
  dateRangeFromStore,
  dateRangeToStore,
} from '@/components/ui/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function rangeParams(fromKey: string, toKey: string) {
  return { from: fromKey, to: toKey };
}

export function AvailabilityOverviewPage() {
  const today = todayDateKey();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(addDaysToDateKey(today, 30));
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const dateRange = useMemo(
    () => dateRangeFromStore(fromDate, toDate),
    [fromDate, toDate],
  );

  const overviewQuery = useQuery({
    queryKey: ['availability-overview', fromDate, toDate],
    queryFn: async () => {
      const res = await api.get<AvailabilityOverview>(
        '/admin/availability-overview',
        { params: rangeParams(fromDate, toDate) },
      );
      return res.data;
    },
    enabled: Boolean(fromDate && toDate && fromDate <= toDate),
  });

  const loadErrorDetail = useMemo(() => {
    if (!overviewQuery.isError) return null;
    const err = overviewQuery.error as {
      response?: { status?: number; data?: { message?: string | string[] } };
    };
    const msg = err.response?.data?.message;
    const text = Array.isArray(msg) ? msg.join(', ') : msg;
    if (err.response?.status === 403) {
      return az.availabilityOverview.errorForbidden;
    }
    if (err.response?.status === 404) {
      return az.availabilityOverview.errorNotFound;
    }
    if (
      err.response?.status === 400 &&
      typeof text === 'string' &&
      text.includes(String(MAX_AVAILABILITY_RANGE_DAYS))
    ) {
      return az.availabilityOverview.errorRangeTooLong(MAX_AVAILABILITY_RANGE_DAYS);
    }
    return text ?? az.availabilityOverview.loadError;
  }, [overviewQuery.isError, overviewQuery.error]);

  const selectedAssignee = overviewQuery.data?.assignees.find(
    (a) => a.id === selectedAssigneeId,
  );

  const focusDay = useMemo(() => {
    if (!selectedAssignee || !focusDate) return null;
    return selectedAssignee.days.find((d) => d.date === focusDate) ?? null;
  }, [selectedAssignee, focusDate]);

  const applyPreset = (days: number) => {
    const from = todayDateKey();
    setFromDate(from);
    setToDate(addDaysToDateKey(from, days - 1));
  };

  const handleRangeChange = (range: DateRange | undefined) => {
    const next = dateRangeToStore(range);
    if (!next.from) return;
    const from = next.from;
    const to = next.to
      ? clampRangeEnd(from, next.to)
      : addDaysToDateKey(from, 30);
    setFromDate(from);
    setToDate(to);
  };

  return (
    <div className="mx-auto max-w-[1680px] p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <CalendarRange className="h-7 w-7 text-primary" />
            {az.availabilityOverview.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {az.availabilityOverview.subtitle}
          </p>
        </div>
      </header>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <DateRangePicker
            value={dateRange}
            onChange={handleRangeChange}
            placeholder={az.map.pickDateRange}
            className="w-full min-w-[26rem] max-w-full sm:w-auto"
            numberOfMonths={2}
          />
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(14)}>
              {az.availabilityOverview.preset14}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(31)}>
              {az.availabilityOverview.preset31}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyPreset(62)}>
              {az.availabilityOverview.preset62}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 border-l border-border/60 pl-3 text-xs text-muted-foreground">
            {(['open', 'partial', 'closed', 'off', 'busy'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  className={cn('inline-block h-3 w-3 rounded-sm', AVAILABILITY_STATUS_CLASS[s])}
                />
                {az.availabilityOverview.status[s]}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]">
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-base">
              {az.availabilityOverview.matrixTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {overviewQuery.isLoading && <Skeleton className="h-72 w-full" />}
            {overviewQuery.isError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <p className="font-medium">{az.availabilityOverview.loadError}</p>
                {loadErrorDetail && (
                  <p className="mt-1 text-xs opacity-90">{loadErrorDetail}</p>
                )}
              </div>
            )}
            {overviewQuery.data && (
              <AvailabilityOverviewMatrix
                data={overviewQuery.data}
                search={search}
                onSearchChange={setSearch}
                selectedAssigneeId={selectedAssigneeId}
                focusDate={focusDate}
                onSelectAssignee={(id) => {
                  setSelectedAssigneeId(id);
                  setFocusDate(null);
                }}
                onSelectCell={(id, date) => {
                  setSelectedAssigneeId(id);
                  setFocusDate(date);
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-4">
          <CardHeader className="space-y-2 p-3 pb-2">
            {selectedAssignee ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {selectedAssignee.name}
                    </CardTitle>
                    {selectedAssignee.organization && (
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedAssignee.organization.name}
                      </p>
                    )}
                  </div>
                  {focusDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title={az.availabilityOverview.clearDayFocus}
                      onClick={() => setFocusDate(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {focusDate && (
                  <p className="text-xs text-muted-foreground">
                    {az.availabilityOverview.focusDate(
                      format(parseISO(focusDate), 'dd MMM yyyy', { locale: azLocale }),
                    )}
                  </p>
                )}
              </>
            ) : (
              <CardTitle className="text-base">
                {az.availabilityOverview.selectAssignee}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {selectedAssigneeId ? (
              <ExecutorAvailabilityTab
                variant="overview"
                assigneeId={selectedAssigneeId}
                focusDate={focusDate}
                focusDay={focusDay}
                onFocusDateChange={setFocusDate}
                rangeFrom={fromDate}
                rangeTo={toDate}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {az.availabilityOverview.selectHint}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
