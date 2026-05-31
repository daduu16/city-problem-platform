import { useCallback, useMemo, useRef, useState } from 'react';
import { az } from '@/i18n/az';
import type { AssigneeAvailabilityCalendarDay } from '@/types';
import { minutesToTimeInput } from '@/components/executors/availability-utils';
import {
  bakuLocalToUtc,
  formatBakuDate,
  getBakuMinutes,
  toBakuDateKey,
} from '@/lib/baku-date';
import { cn } from '@/lib/utils';

const DAY_MINUTES = 24 * 60;
const SNAP = 15;

type Segment = {
  startMinute: number;
  endMinute: number;
  kind: 'work' | 'unavailable' | 'fixed' | 'window' | 'draft';
  label?: string;
};

type Props = {
  day: AssigneeAvailabilityCalendarDay;
  draftStart?: Date;
  draftEnd?: Date;
  onPickRange: (startMinute: number, endMinute: number) => void;
  /** Hide section title when embedded in a multi-day list. */
  embedded?: boolean;
  /** Hide color legend (shown once on the parent for multi-day). */
  hideLegend?: boolean;
};

function clipIsoToDayMinutes(
  isoStart: string,
  isoEnd: string,
  dateKey: string,
): { startMinute: number; endMinute: number } | null {
  const dayStart = bakuLocalToUtc(dateKey, 0);
  const dayEnd = bakuLocalToUtc(dateKey, DAY_MINUTES);
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  if (end <= dayStart || start >= dayEnd) return null;
  const segStart = Math.max(start.getTime(), dayStart.getTime());
  const segEnd = Math.min(end.getTime(), dayEnd.getTime());
  return {
    startMinute: getBakuMinutes(new Date(segStart)),
    endMinute: getBakuMinutes(new Date(segEnd)),
  };
}

function pct(minute: number) {
  return `${(minute / DAY_MINUTES) * 100}%`;
}

function widthPct(start: number, end: number) {
  return `${((end - start) / DAY_MINUTES) * 100}%`;
}

function snapMinute(raw: number): number {
  const snapped = Math.round(raw / SNAP) * SNAP;
  return Math.min(DAY_MINUTES - SNAP, Math.max(0, snapped));
}

function minuteFromClientX(el: HTMLDivElement, clientX: number): number {
  const rect = el.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return snapMinute(ratio * DAY_MINUTES);
}

export function AssigneeDayTimeline({
  day,
  draftStart,
  draftEnd,
  onPickRange,
  embedded = false,
  hideLegend = false,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [anchorMinute, setAnchorMinute] = useState<number | null>(null);
  const [hoverMinute, setHoverMinute] = useState<number | null>(null);
  const pointerStart = useRef<number | null>(null);
  const pointerMoved = useRef(false);

  const segments = useMemo(() => {
    const list: Segment[] = [];

    for (const w of day.effectiveWindows) {
      if (w.endMinute > w.startMinute) {
        list.push({
          startMinute: w.startMinute,
          endMinute: w.endMinute,
          kind: 'work',
        });
      }
    }
    for (const u of day.unavailableBlocks) {
      if (u.endMinute > u.startMinute) {
        list.push({
          startMinute: u.startMinute,
          endMinute: u.endMinute,
          kind: 'unavailable',
        });
      }
    }
    for (const t of day.tasks) {
      const clip = clipIsoToDayMinutes(t.startsAt, t.endsAt, day.date);
      if (!clip) continue;
      list.push({
        ...clip,
        kind: t.scheduleType === 'WINDOW' ? 'window' : 'fixed',
        label: t.title,
      });
    }
    if (draftStart && draftEnd) {
      const clip = clipIsoToDayMinutes(
        draftStart.toISOString(),
        draftEnd.toISOString(),
        day.date,
      );
      if (clip && clip.endMinute > clip.startMinute) {
        list.push({ ...clip, kind: 'draft' });
      }
    }
    return list;
  }, [day, draftStart, draftEnd]);

  const previewRange = useMemo(() => {
    if (anchorMinute == null) return null;
    const end = hoverMinute ?? anchorMinute + SNAP;
    const start = Math.min(anchorMinute, end);
    const finish = Math.max(anchorMinute, end);
    if (finish <= start) return { start, end: start + SNAP };
    return { start, end: finish };
  }, [anchorMinute, hoverMinute]);

  const commitRange = useCallback(
    (start: number, end: number) => {
      const a = Math.min(start, end);
      let b = Math.max(start, end);
      if (b <= a) b = a + SNAP;
      onPickRange(a, b);
      setAnchorMinute(null);
      setHoverMinute(null);
    },
    [onPickRange],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = barRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const m = minuteFromClientX(el, e.clientX);
    pointerStart.current = m;
    pointerMoved.current = false;
    if (anchorMinute == null) {
      setAnchorMinute(m);
    }
    setHoverMinute(m);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = barRef.current;
    if (!el || pointerStart.current == null) return;
    const m = minuteFromClientX(el, e.clientX);
    if (Math.abs(m - pointerStart.current) >= SNAP) {
      pointerMoved.current = true;
    }
    setHoverMinute(m);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = barRef.current;
    if (!el || pointerStart.current == null) return;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const end = minuteFromClientX(el, e.clientX);
    const start = pointerStart.current;
    pointerStart.current = null;

    if (pointerMoved.current) {
      commitRange(start, end);
      pointerMoved.current = false;
      return;
    }

    if (anchorMinute != null && anchorMinute !== end) {
      commitRange(anchorMinute, end);
      return;
    }

    setAnchorMinute(end);
    setHoverMinute(end);
    pointerMoved.current = false;
  };

  return (
    <div className="space-y-2">
      {!embedded && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium">{az.tasks.dayTimeline}</p>
          <p className="text-[10px] text-muted-foreground">{day.date}</p>
        </div>
      )}
      {embedded && (
        <p className="text-[10px] font-medium text-muted-foreground">
          {formatBakuDate(day.date)}
        </p>
      )}
      {!embedded && (
        <p className="text-[10px] text-muted-foreground">
          {anchorMinute == null
            ? az.tasks.dayTimelineRangeHint
            : az.tasks.dayTimelineRangeHintSecond}
        </p>
      )}

      <div
        ref={barRef}
        role="group"
        aria-label={az.tasks.dayTimeline}
        className="relative h-14 cursor-crosshair overflow-hidden rounded-md border border-border bg-muted/40 touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          if (pointerStart.current == null) setHoverMinute(null);
        }}
      >
        {segments
          .filter((s) => s.kind === 'work')
          .map((s, i) => (
            <div
              key={`w-${i}`}
              className="absolute inset-y-0 bg-emerald-500/25"
              style={{
                left: pct(s.startMinute),
                width: widthPct(s.startMinute, s.endMinute),
              }}
            />
          ))}
        {segments
          .filter((s) => s.kind === 'unavailable')
          .map((s, i) => (
            <div
              key={`u-${i}`}
              className="absolute inset-y-0 bg-zinc-400/40"
              style={{
                left: pct(s.startMinute),
                width: widthPct(s.startMinute, s.endMinute),
              }}
            />
          ))}
        {segments
          .filter((s) => s.kind === 'window')
          .map((s, i) => (
            <div
              key={`wt-${i}`}
              title={s.label}
              className="absolute inset-y-1.5 rounded-sm border border-amber-500/60 bg-amber-400/50"
              style={{
                left: pct(s.startMinute),
                width: widthPct(s.startMinute, s.endMinute),
              }}
            />
          ))}
        {segments
          .filter((s) => s.kind === 'fixed')
          .map((s, i) => (
            <div
              key={`f-${i}`}
              title={s.label}
              className="absolute inset-y-1.5 rounded-sm bg-red-500/85"
              style={{
                left: pct(s.startMinute),
                width: widthPct(s.startMinute, s.endMinute),
              }}
            />
          ))}
        {segments
          .filter((s) => s.kind === 'draft')
          .map((s, i) => (
            <div
              key={`d-${i}`}
              className="absolute inset-y-0 rounded-sm border-2 border-primary bg-primary/30"
              style={{
                left: pct(s.startMinute),
                width: widthPct(s.startMinute, s.endMinute),
              }}
            />
          ))}
        {previewRange && anchorMinute != null && (
          <div
            className={cn(
              'absolute inset-y-0 rounded-sm border-2 border-dashed border-primary/80 bg-primary/20',
            )}
            style={{
              left: pct(previewRange.start),
              width: widthPct(previewRange.start, previewRange.end),
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-1 text-[9px] text-muted-foreground">
          {[0, 6, 12, 18].map((h) => (
            <span key={h}>{minutesToTimeInput(h * 60)}</span>
          ))}
        </div>
      </div>

      {previewRange && (
        <p className="text-center text-[11px] font-medium text-primary">
          {minutesToTimeInput(previewRange.start)} — {minutesToTimeInput(previewRange.end)}
        </p>
      )}

      {!hideLegend && (
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
      )}
    </div>
  );
}

export function minuteOnDateKey(dateKey: string, minute: number): Date {
  return bakuLocalToUtc(dateKey, minute);
}

export function dateKeyFromDraft(d: Date): string {
  return toBakuDateKey(d);
}
