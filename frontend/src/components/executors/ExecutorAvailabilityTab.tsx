import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { az } from '@/i18n/az';
import type {
  AssigneeAvailabilityCalendar,
  AssigneeAvailabilityCalendarDay,
  AssigneeAvailabilitySlot,
} from '@/types';
import { Button } from '@/components/ui/button';
import { DatePicker, dateKeyToDate } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AvailabilityDaySummary } from './AvailabilityDaySummary';
import {
  addDaysToDateKey,
  AvailabilityDraftSlot,
  dayCountInclusive,
  draftToPayload,
  isClosedDayMarker,
  validateAvailabilityDraft,
  minutesToTimeInput,
  slotFromApi,
  timeInputToMinutes,
  todayDateKey,
} from './availability-utils';

type SubMode = 'weekly' | 'date' | 'busy';
type LayoutVariant = 'standalone' | 'overview';

type Props = {
  assigneeId: string;
  /** Opens special-day editor (Assignees page). */
  initialSpecialDate?: string;
  /** Selected day from overview matrix (controlled). */
  focusDate?: string | null;
  onFocusDateChange?: (date: string | null) => void;
  /** Snapshot from overview API for the focused day. */
  focusDay?: AssigneeAvailabilityCalendarDay | null;
  rangeFrom?: string;
  rangeTo?: string;
  variant?: LayoutVariant;
};

function newClientId() {
  return `tmp-${crypto.randomUUID()}`;
}

function IntervalEditor({
  slot,
  onChange,
  onRemove,
}: {
  slot: AvailabilityDraftSlot;
  onChange: (next: AvailabilityDraftSlot) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/20 p-2">
      <div className="space-y-1">
        <Label className="text-xs">{az.availability.startTime}</Label>
        <Input
          type="time"
          className="h-8 w-[7rem]"
          value={minutesToTimeInput(slot.startMinute)}
          onChange={(e) =>
            onChange({
              ...slot,
              startMinute: timeInputToMinutes(e.target.value),
            })
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{az.availability.endTime}</Label>
        <Input
          type="time"
          className="h-8 w-[7rem]"
          value={minutesToTimeInput(slot.endMinute)}
          onChange={(e) =>
            onChange({
              ...slot,
              endMinute: timeInputToMinutes(e.target.value),
            })
          }
        />
      </div>
      <div className="min-w-[8rem] flex-1 space-y-1">
        <Label className="text-xs">{az.availability.label}</Label>
        <Input
          className="h-8"
          placeholder={az.availability.labelPlaceholder}
          value={slot.label ?? ''}
          onChange={(e) => onChange({ ...slot, label: e.target.value })}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-destructive"
        onClick={onRemove}
        title={az.availability.removeInterval}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CalendarPreview({
  calendar,
  dayCount,
}: {
  calendar: AssigneeAvailabilityCalendar;
  dayCount: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {az.availability.previewTitle(dayCount)}
      </p>
      <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          {az.availability.previewAvailable}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-secondary border border-border" />
          {az.availability.previewOffHours}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
          {az.availability.previewBusy}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendar.days.map((day) => {
          const hasWindows = day.effectiveWindows.some(
            (w) => w.endMinute > w.startMinute,
          );
          const hasBusy =
            day.tasks.length > 0 || day.unavailableBlocks.length > 0;
          return (
            <div
              key={day.date}
              className={cn(
                'rounded p-1 text-center',
                hasBusy && 'bg-red-50 dark:bg-red-950/30',
                !hasBusy && hasWindows && 'bg-emerald-50 dark:bg-emerald-950/20',
                !hasBusy && !hasWindows && 'bg-muted',
              )}
              title={day.date}
            >
              <div className="font-medium">{day.date.slice(8)}</div>
              <div className="text-[9px] text-muted-foreground">
                {az.availability.weekdays[day.dayOfWeek]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditorSection({
  title,
  hint,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint?: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        className="flex w-full items-start gap-2 p-3 text-left hover:bg-muted/40"
        onClick={onToggle}
      >
        <ChevronRight
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-90',
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{title}</span>
            {!open && summary && (
              <span className="text-xs text-muted-foreground">{summary}</span>
            )}
          </div>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </button>
      {open && <div className="border-t px-3 pb-3 pt-2">{children}</div>}
    </div>
  );
}

export function ExecutorAvailabilityTab({
  assigneeId,
  initialSpecialDate,
  focusDate = null,
  onFocusDateChange,
  focusDay = null,
  rangeFrom,
  rangeTo,
  variant = 'standalone',
}: Props) {
  const isOverview = variant === 'overview';
  const queryClient = useQueryClient();
  const [subMode, setSubMode] = useState<SubMode>(
    initialSpecialDate || focusDate ? 'date' : 'weekly',
  );
  const [draft, setDraft] = useState<AvailabilityDraftSlot[]>([]);
  const [saveOk, setSaveOk] = useState(false);
  const [specialDate, setSpecialDate] = useState(
    focusDate ?? initialSpecialDate ?? todayDateKey(),
  );
  const [expanded, setExpanded] = useState<Set<SubMode>>(() => {
    if (focusDate) {
      const next = new Set<SubMode>(['date']);
      if (focusDay?.tasks.length) next.add('busy');
      return next;
    }
    return new Set<SubMode>(['weekly']);
  });

  const syncSpecialDate = (dateKey: string) => {
    setSpecialDate(dateKey);
    onFocusDateChange?.(dateKey);
  };

  useEffect(() => {
    if (initialSpecialDate) {
      setSpecialDate(initialSpecialDate);
      setSubMode('date');
    }
  }, [initialSpecialDate, assigneeId]);

  useEffect(() => {
    if (!isOverview) return;
    if (focusDate) {
      setSpecialDate(focusDate);
      setSubMode('date');
      setExpanded(() => {
        const next = new Set<SubMode>(['date']);
        if (focusDay?.tasks.length || focusDay?.unavailableBlocks.length) {
          next.add('busy');
        }
        return next;
      });
    } else {
      setSubMode('weekly');
      setExpanded(new Set(['weekly']));
    }
  }, [focusDate, assigneeId, isOverview, focusDay?.tasks.length, focusDay?.unavailableBlocks.length]);

  const slotsQuery = useQuery({
    queryKey: ['assignee-availability', assigneeId],
    queryFn: async () => {
      const res = await api.get<AssigneeAvailabilitySlot[]>(
        `/assignees/${assigneeId}/availability`,
      );
      return res.data;
    },
  });

  useEffect(() => {
    if (slotsQuery.data) {
      setDraft(slotsQuery.data.map(slotFromApi));
      setSaveOk(false);
    }
  }, [slotsQuery.data]);

  const previewRange = useMemo(() => {
    const fromKey = rangeFrom ?? todayDateKey();
    const toKey = rangeTo ?? addDaysToDateKey(fromKey, 13);
    return { from: fromKey, to: toKey };
  }, [rangeFrom, rangeTo]);

  const previewDayCount = useMemo(
    () => dayCountInclusive(previewRange.from, previewRange.to),
    [previewRange],
  );

  const calendarQuery = useQuery({
    queryKey: ['assignee-availability-calendar', assigneeId, previewRange],
    queryFn: async () => {
      const res = await api.get<AssigneeAvailabilityCalendar>(
        `/assignees/${assigneeId}/availability/calendar`,
        { params: { from: previewRange.from, to: previewRange.to } },
      );
      return res.data;
    },
    enabled: Boolean(assigneeId) && !isOverview,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/assignees/${assigneeId}/availability`, {
        slots: draftToPayload(draft),
      });
    },
    onSuccess: () => {
      setSaveOk(true);
      void queryClient.invalidateQueries({
        queryKey: ['assignee-availability', assigneeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['assignee-availability-calendar', assigneeId],
      });
      void queryClient.invalidateQueries({ queryKey: ['availability-overview'] });
    },
  });

  const weeklySlots = useMemo(
    () =>
      draft.filter(
        (s) =>
          s.kind === 'WEEKLY' &&
          s.slotType === 'AVAILABLE' &&
          s.endMinute > s.startMinute,
      ),
    [draft],
  );

  const isWeeklyDayClosed = (dayOfWeek: number) =>
    draft.some(
      (s) =>
        s.kind === 'WEEKLY' &&
        s.slotType === 'AVAILABLE' &&
        s.dayOfWeek === dayOfWeek &&
        isClosedDayMarker(s),
    );

  const dateSlotsForDay = useMemo(
    () =>
      draft.filter(
        (s) =>
          s.kind === 'DATE' &&
          s.slotType === 'AVAILABLE' &&
          s.date === specialDate &&
          s.endMinute > s.startMinute,
      ),
    [draft, specialDate],
  );

  const isSpecialDayClosed = useMemo(
    () =>
      draft.some(
        (s) =>
          s.kind === 'DATE' &&
          s.slotType === 'AVAILABLE' &&
          s.date === specialDate &&
          s.endMinute === s.startMinute,
      ),
    [draft, specialDate],
  );

  const busySlotsForDay = useMemo(
    () =>
      draft.filter(
        (s) =>
          s.kind === 'DATE' &&
          s.slotType === 'UNAVAILABLE' &&
          s.date === specialDate,
      ),
    [draft, specialDate],
  );

  const weeklyIntervalCount = weeklySlots.length;
  const weeklyClosedDayCount = az.availability.weekdays.filter((_, i) =>
    isWeeklyDayClosed(i),
  ).length;

  const draftValid = useMemo(() => validateAvailabilityDraft(draft), [draft]);

  const toggleSection = (mode: SubMode) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

  const updateSlot = (clientId: string, next: AvailabilityDraftSlot) => {
    setSaveOk(false);
    setDraft((prev) => prev.map((s) => (s.clientId === clientId ? next : s)));
  };

  const removeSlot = (clientId: string) => {
    setSaveOk(false);
    setDraft((prev) => prev.filter((s) => s.clientId !== clientId));
  };

  const addWeeklyInterval = (dayOfWeek: number) => {
    setSaveOk(false);
    setDraft((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        kind: 'WEEKLY',
        dayOfWeek,
        slotType: 'AVAILABLE',
        startMinute: 9 * 60,
        endMinute: 18 * 60,
      },
    ]);
  };

  const closeWeeklyDay = (dayOfWeek: number) => {
    setSaveOk(false);
    setDraft((prev) => [
      ...prev.filter(
        (s) => !(s.kind === 'WEEKLY' && s.dayOfWeek === dayOfWeek),
      ),
      {
        clientId: newClientId(),
        kind: 'WEEKLY',
        dayOfWeek,
        slotType: 'AVAILABLE',
        startMinute: 0,
        endMinute: 0,
      },
    ]);
  };

  const openWeeklyDay = (dayOfWeek: number) => {
    setSaveOk(false);
    setDraft((prev) =>
      prev.filter(
        (s) =>
          !(
            s.kind === 'WEEKLY' &&
            s.dayOfWeek === dayOfWeek &&
            isClosedDayMarker(s)
          ),
      ),
    );
  };

  const addDateInterval = () => {
    setSaveOk(false);
    setDraft((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        kind: 'DATE',
        date: specialDate,
        slotType: 'AVAILABLE',
        startMinute: 9 * 60,
        endMinute: 18 * 60,
      },
    ]);
  };

  const clearDateOverride = () => {
    setSaveOk(false);
    setDraft((prev) =>
      prev.filter((s) => !(s.kind === 'DATE' && s.date === specialDate)),
    );
  };

  const closeSpecialDay = () => {
    setSaveOk(false);
    setDraft((prev) => [
      ...prev.filter(
        (s) => !(s.kind === 'DATE' && s.date === specialDate),
      ),
      {
        clientId: newClientId(),
        kind: 'DATE',
        date: specialDate,
        slotType: 'AVAILABLE',
        startMinute: 0,
        endMinute: 0,
      },
    ]);
  };

  const openSpecialDay = () => {
    setSaveOk(false);
    setDraft((prev) =>
      prev.filter(
        (s) =>
          !(
            s.kind === 'DATE' &&
            s.date === specialDate &&
            isClosedDayMarker(s)
          ),
      ),
    );
  };

  const addBusyBlock = () => {
    setSaveOk(false);
    setDraft((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        kind: 'DATE',
        date: specialDate,
        slotType: 'UNAVAILABLE',
        startMinute: 12 * 60,
        endMinute: 13 * 60,
        label: '',
      },
    ]);
  };

  const weeklyEditor = (
    <div className="space-y-3">
      {az.availability.weekdays.map((label, dayOfWeek) => {
        const daySlots = weeklySlots.filter((s) => s.dayOfWeek === dayOfWeek);
        const dayClosed = isWeeklyDayClosed(dayOfWeek);
        return (
          <div key={dayOfWeek} className="rounded-md bg-muted/30 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{label}</span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => addWeeklyInterval(dayOfWeek)}
                  disabled={dayClosed}
                >
                  <Plus className="h-3 w-3" />
                  {az.availability.addInterval}
                </Button>
                {dayClosed ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => openWeeklyDay(dayOfWeek)}
                  >
                    {az.availability.reopenDay}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => closeWeeklyDay(dayOfWeek)}
                  >
                    {az.availability.closeDay}
                  </Button>
                )}
              </div>
            </div>
            {dayClosed && (
              <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                {az.availability.weeklyCloseDayHint}
              </p>
            )}
            {daySlots.length === 0 && !dayClosed ? (
              <p className="text-xs text-muted-foreground">
                {az.availability.noSlots}
              </p>
            ) : (
              <div className="space-y-2">
                {daySlots.map((slot) => (
                  <IntervalEditor
                    key={slot.clientId}
                    slot={slot}
                    onChange={(next) => updateSlot(slot.clientId, next)}
                    onRemove={() => removeSlot(slot.clientId)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const dateEditor = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>{az.availability.pickDate}</Label>
        <DatePicker
          value={specialDate}
          onChange={(d) => d && syncSpecialDate(d)}
          placeholder={az.availability.pickDate}
          className="max-w-xs"
          fromDate={rangeFrom ? dateKeyToDate(rangeFrom) : undefined}
          toDate={rangeTo ? dateKeyToDate(rangeTo) : undefined}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {az.availability.dateOverrideHint}
      </p>
      {isSpecialDayClosed && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          {az.availability.dayClosedBanner}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={addDateInterval}
          disabled={isSpecialDayClosed}
        >
          <Plus className="h-3 w-3" />
          {az.availability.addInterval}
        </Button>
        {isSpecialDayClosed ? (
          <Button type="button" size="sm" variant="ghost" onClick={openSpecialDay}>
            {az.availability.reopenDay}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={closeSpecialDay}
          >
            {az.availability.closeDay}
          </Button>
        )}
        {(dateSlotsForDay.length > 0 || isSpecialDayClosed) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearDateOverride}
          >
            {az.availability.clearDateOverride}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{az.availability.closeDayHint}</p>
      <div className="space-y-2">
        {dateSlotsForDay.length === 0 && !isSpecialDayClosed ? (
          <p className="text-sm text-muted-foreground">{az.availability.noSlots}</p>
        ) : (
          dateSlotsForDay.map((slot) => (
            <IntervalEditor
              key={slot.clientId}
              slot={slot}
              onChange={(next) => updateSlot(slot.clientId, next)}
              onRemove={() => removeSlot(slot.clientId)}
            />
          ))
        )}
      </div>
    </div>
  );

  const busyEditor = (
    <div className="space-y-3">
      {!isOverview && (
        <div className="space-y-1.5">
          <Label>{az.availability.pickDate}</Label>
          <DatePicker
            value={specialDate}
            onChange={(d) => d && syncSpecialDate(d)}
            placeholder={az.availability.pickDate}
            className="max-w-xs"
            fromDate={rangeFrom ? dateKeyToDate(rangeFrom) : undefined}
            toDate={rangeTo ? dateKeyToDate(rangeTo) : undefined}
          />
        </div>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1"
        onClick={addBusyBlock}
      >
        <Plus className="h-3 w-3" />
        {az.availability.busyAdd}
      </Button>
      <div className="space-y-2">
        {busySlotsForDay.length === 0 ? (
          <p className="text-sm text-muted-foreground">{az.availability.noSlots}</p>
        ) : (
          busySlotsForDay.map((slot) => (
            <IntervalEditor
              key={slot.clientId}
              slot={slot}
              onChange={(next) => updateSlot(slot.clientId, next)}
              onRemove={() => removeSlot(slot.clientId)}
            />
          ))
        )}
      </div>
    </div>
  );

  if (slotsQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (slotsQuery.isError) {
    return (
      <p className="text-sm text-destructive">{az.availability.loadError}</p>
    );
  }

  const saveBar = (
    <div className="space-y-2">
      <Separator />
      {!draftValid && (
        <p className="text-xs text-destructive">{az.availability.saveBlockedInvalid}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={saveMutation.isPending || !draftValid}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? az.availability.saving : az.availability.save}
        </Button>
        {saveOk && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            {az.availability.saved}
          </span>
        )}
        {saveMutation.isError && (
          <span className="text-sm text-destructive">{az.availability.loadError}</span>
        )}
      </div>
      {isOverview && (
        <p className="text-xs text-muted-foreground">{az.availabilityOverview.saveHint}</p>
      )}
    </div>
  );

  if (isOverview) {
    return (
      <div className="space-y-4">
        {focusDay ? (
          <AvailabilityDaySummary day={focusDay} />
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {az.availabilityOverview.noDaySelected}
          </p>
        )}

        <EditorSection
          title={az.availabilityOverview.specialDaySection}
          hint={az.availability.dateOverrideHint}
          summary={
            isSpecialDayClosed
              ? az.availability.dayClosedBanner
              : dateSlotsForDay.length > 0
                ? az.availabilityOverview.intervalCount(dateSlotsForDay.length)
                : az.availability.noSlots
          }
          open={expanded.has('date')}
          onToggle={() => toggleSection('date')}
        >
          {dateEditor}
        </EditorSection>

        <EditorSection
          title={az.availabilityOverview.busySection}
          hint={az.availabilityOverview.busySectionHint}
          summary={
            busySlotsForDay.length > 0
              ? az.availabilityOverview.blockCount(busySlotsForDay.length)
              : az.availability.noSlots
          }
          open={expanded.has('busy')}
          onToggle={() => toggleSection('busy')}
        >
          {busyEditor}
        </EditorSection>

        <EditorSection
          title={az.availabilityOverview.weeklySection}
          hint={az.availabilityOverview.weeklySectionHint}
          summary={
            weeklyClosedDayCount > 0
              ? `${az.availabilityOverview.intervalCount(weeklyIntervalCount)} · ${az.tasks.closedDaysCount(weeklyClosedDayCount)}`
              : az.availabilityOverview.intervalCount(weeklyIntervalCount)
          }
          open={expanded.has('weekly')}
          onToggle={() => toggleSection('weekly')}
        >
          {weeklyEditor}
        </EditorSection>

        {saveBar}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {(['weekly', 'date', 'busy'] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={subMode === mode ? 'default' : 'outline'}
            onClick={() => setSubMode(mode)}
          >
            {mode === 'weekly'
              ? az.availability.weekly
              : mode === 'date'
                ? az.availability.specialDay
                : az.availability.busy}
          </Button>
        ))}
      </div>

      {subMode === 'weekly' && weeklyEditor}
      {subMode === 'date' && dateEditor}
      {subMode === 'busy' && busyEditor}

      {calendarQuery.data && (
        <CalendarPreview
          calendar={calendarQuery.data}
          dayCount={previewDayCount}
        />
      )}

      {saveBar}
    </div>
  );
}
