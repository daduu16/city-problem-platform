import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Loader2 } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { api } from '@/lib/api';
import { az } from '@/i18n/az';
import { useAuthStore } from '@/stores/authStore';
import type {
  AssigneeAvailabilityCalendar,
  CategoryAssignee,
  ScheduleTaskView,
} from '@/types';
import { todayDateKey } from '@/lib/baku-date';
import { flattenCalendarTasks } from '@/lib/scheduleTasks';
import {
  addDaysToDateKey,
  clampRangeEnd,
  MAX_AVAILABILITY_RANGE_DAYS,
} from '@/components/executors/availability-utils';
import { ScheduleTasksTable } from '@/components/schedule/ScheduleTasksTable';
import { ScheduleTaskDetailDrawer } from '@/components/schedule/ScheduleTaskDetailDrawer';
import { ScheduleTaskMap } from '@/components/schedule/ScheduleTaskMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  DateRangePicker,
  dateRangeFromStore,
  dateRangeToStore,
} from '@/components/ui/date-range-picker';
import { ApiConnectionAlert } from '@/components/ApiConnectionAlert';
import { isApiUnreachable } from '@/lib/apiError';

export function ExecutorSchedulePage() {
  const { can } = useAuthStore();
  const canPickAssignee = can('manage_assignees');

  const today = todayDateKey();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(() => addDaysToDateKey(today, 13));
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<ScheduleTaskView | null>(null);

  const dateRange = useMemo(
    () => dateRangeFromStore(fromDate, toDate),
    [fromDate, toDate],
  );

  const assigneesQuery = useQuery({
    queryKey: ['assignees', 'schedule'],
    enabled: canPickAssignee,
    queryFn: async () => {
      const res = await api.get<CategoryAssignee[]>('/assignees');
      return res.data.filter((a) => a.isActive !== false);
    },
  });

  const selfAssigneeQuery = useQuery({
    queryKey: ['assignees', 'schedule-profile'],
    enabled: !canPickAssignee,
    queryFn: async () => {
      const res = await api.get<CategoryAssignee | null>('/assignees/schedule-profile');
      return res.data;
    },
  });

  const linkedAssigneeId = selfAssigneeQuery.data?.id ?? '';

  useEffect(() => {
    if (assigneeId) return;
    if (canPickAssignee && assigneesQuery.data?.length) {
      setAssigneeId(assigneesQuery.data[0]!.id);
      return;
    }
    if (linkedAssigneeId) {
      setAssigneeId(linkedAssigneeId);
    }
  }, [assigneeId, assigneesQuery.data, canPickAssignee, linkedAssigneeId]);

  const calendarQuery = useQuery({
    queryKey: ['assignee-schedule', assigneeId, fromDate, toDate],
    enabled: Boolean(assigneeId && fromDate && toDate && fromDate <= toDate),
    queryFn: async () => {
      const res = await api.get<AssigneeAvailabilityCalendar>(
        `/assignees/${assigneeId}/availability/calendar`,
        { params: { from: fromDate, to: toDate } },
      );
      return res.data;
    },
  });

  const rangeTasks = useMemo(
    () => flattenCalendarTasks(calendarQuery.data?.days ?? []),
    [calendarQuery.data?.days],
  );

  const selectedAssignee = useMemo(() => {
    if (canPickAssignee) {
      return assigneesQuery.data?.find((a) => a.id === assigneeId);
    }
    return selfAssigneeQuery.data ?? undefined;
  }, [assigneeId, assigneesQuery.data, canPickAssignee, selfAssigneeQuery.data]);

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
      ? clampRangeEnd(from, next.to, MAX_AVAILABILITY_RANGE_DAYS)
      : addDaysToDateKey(from, 13);
    setFromDate(from);
    setToDate(to);
  };

  return (
    <div className="w-full min-w-0 p-6">
      <header className="mb-6 space-y-2 border-b border-border/60 pb-5">
        <div className="flex flex-wrap items-start gap-3">
          <CalendarDays className="mt-1 h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{az.schedule.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{az.schedule.subtitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{az.schedule.bakuTimeHint}</p>
          </div>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {canPickAssignee ? az.schedule.selectAssignee : az.schedule.mySchedule}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canPickAssignee ? (
            <div className="max-w-md space-y-2">
              <Label htmlFor="schedule-assignee">{az.schedule.selectAssignee}</Label>
              <select
                id="schedule-assignee"
                className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={assigneesQuery.isLoading}
              >
                <option value="">{az.schedule.selectAssignee}</option>
                {(assigneesQuery.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm font-medium">
              {selectedAssignee?.name ?? (linkedAssigneeId ? '…' : az.schedule.noAssigneeLinked)}
            </p>
          )}

          {!canPickAssignee &&
            !linkedAssigneeId &&
            !selfAssigneeQuery.isLoading &&
            !selfAssigneeQuery.isFetching && (
              <p className="text-sm text-destructive">{az.schedule.noAssigneeLinked}</p>
            )}
        </CardContent>
      </Card>

      {!assigneeId ? null : (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <DateRangePicker
                value={dateRange}
                onChange={handleRangeChange}
                placeholder={az.map.pickDateRange}
                className="w-full min-w-[26rem] max-w-full sm:w-auto"
                numberOfMonths={2}
              />
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(7)}
                >
                  {az.schedule.preset7}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(14)}
                >
                  {az.schedule.preset14}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(31)}
                >
                  {az.schedule.preset31}
                </Button>
              </div>
            </CardContent>
          </Card>

          {calendarQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {az.schedule.loading}
            </div>
          )}

          {isApiUnreachable(calendarQuery.error) && (
            <ApiConnectionAlert onRetry={() => void calendarQuery.refetch()} />
          )}

          {calendarQuery.isError && !isApiUnreachable(calendarQuery.error) && (
            <p className="text-sm text-destructive">{az.schedule.loadError}</p>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold">{az.schedule.tasksTableTitle}</h3>
            <ScheduleTasksTable
              tasks={rangeTasks}
              onRowClick={(task) => setSelectedTask(task)}
            />
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold">{az.schedule.mapTitle}</h3>
            <ScheduleTaskMap tasks={rangeTasks} />
          </section>
        </div>
      )}

      <ScheduleTaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
