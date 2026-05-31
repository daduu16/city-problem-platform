import {
  AssigneeAvailabilityKind,
  AssigneeAvailabilitySlotType,
} from '@prisma/client';
import {
  bakuLocalToUtc,
  getBakuMinutes,
  getBakuWeekdayMon0,
  toBakuDateKey,
} from './baku-time.util';
import {
  intersectMinuteRanges,
  mergeMinuteRanges,
  minuteRangeContains,
  MinuteRange,
  subtractMinuteRanges,
} from './interval.util';

export type AvailabilitySlotRow = {
  kind: AssigneeAvailabilityKind;
  dayOfWeek: number | null;
  date: Date | null;
  slotType: AssigneeAvailabilitySlotType;
  startMinute: number;
  endMinute: number;
};

export function slotsToMinuteRanges(
  slots: AvailabilitySlotRow[],
  filter: (s: AvailabilitySlotRow) => boolean,
): MinuteRange[] {
  return slots
    .filter(filter)
    .map((s) => ({ start: s.startMinute, end: s.endMinute }))
    .filter((r) => r.end > r.start);
}

/** AVAILABLE slot with start === end marks an explicitly closed day. */
export function isClosedDayMarker(s: AvailabilitySlotRow): boolean {
  return (
    s.slotType === AssigneeAvailabilitySlotType.AVAILABLE &&
    s.endMinute === s.startMinute
  );
}

export function isDayExplicitlyClosed(
  slots: AvailabilitySlotRow[],
  dateKey: string,
  dayOfWeek: number,
): boolean {
  const dateSlotsForDay = slots.filter(
    (s) =>
      s.kind === AssigneeAvailabilityKind.DATE &&
      s.date != null &&
      dateKeyFromSlot(s.date) === dateKey,
  );
  if (dateSlotsForDay.length > 0) {
    return dateSlotsForDay.some(isClosedDayMarker);
  }
  return slots.some(
    (s) =>
      s.kind === AssigneeAvailabilityKind.WEEKLY &&
      s.dayOfWeek === dayOfWeek &&
      isClosedDayMarker(s),
  );
}

export function getEffectiveWindowsForDay(
  slots: AvailabilitySlotRow[],
  dateKey: string,
  dayOfWeek: number,
): MinuteRange[] {
  const dateSlotsForDay = slots.filter(
    (s) =>
      s.kind === AssigneeAvailabilityKind.DATE &&
      s.date != null &&
      dateKeyFromSlot(s.date) === dateKey,
  );

  const dateAvailable = dateSlotsForDay.filter(
    (s) => s.slotType === AssigneeAvailabilitySlotType.AVAILABLE,
  );

  const hasDateOverride = dateSlotsForDay.length > 0;

  if (hasDateOverride && dateAvailable.some(isClosedDayMarker)) {
    return [];
  }

  const weeklyClosed = slots.some(
    (s) =>
      s.kind === AssigneeAvailabilityKind.WEEKLY &&
      s.dayOfWeek === dayOfWeek &&
      isClosedDayMarker(s),
  );
  if (!hasDateOverride && weeklyClosed) {
    return [];
  }

  const weeklyAvailable = slotsToMinuteRanges(
    slots,
    (s) =>
      s.kind === AssigneeAvailabilityKind.WEEKLY &&
      s.dayOfWeek === dayOfWeek &&
      s.slotType === AssigneeAvailabilitySlotType.AVAILABLE,
  );

  const weeklyUnavailable = slotsToMinuteRanges(
    slots,
    (s) =>
      s.kind === AssigneeAvailabilityKind.WEEKLY &&
      s.dayOfWeek === dayOfWeek &&
      s.slotType === AssigneeAvailabilitySlotType.UNAVAILABLE,
  );

  const dateUnavailable = slotsToMinuteRanges(
    slots,
    (s) =>
      s.kind === AssigneeAvailabilityKind.DATE &&
      s.date != null &&
      dateKeyFromSlot(s.date) === dateKey &&
      s.slotType === AssigneeAvailabilitySlotType.UNAVAILABLE,
  );

  const base = hasDateOverride
    ? slotsToMinuteRanges(
        dateAvailable,
        () => true,
      )
    : weeklyAvailable;

  return subtractMinuteRanges(
    mergeMinuteRanges(base),
    mergeMinuteRanges([...weeklyUnavailable, ...dateUnavailable]),
  );
}

function dateKeyFromSlot(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type AvailabilityCheckReason =
  | 'outside_hours'
  | 'unavailable_block'
  | 'task_conflict';

export function isIntervalWithinWindows(
  start: Date,
  end: Date,
  slots: AvailabilitySlotRow[],
): { ok: boolean; reason?: AvailabilityCheckReason } {
  if (end <= start) return { ok: false, reason: 'outside_hours' };

  let cursor = start;
  while (cursor < end) {
    const dateKey = toBakuDateKey(cursor);
    const dayOfWeek = getBakuWeekdayMon0(cursor);
    const windows = getEffectiveWindowsForDay(slots, dateKey, dayOfWeek);

    const dayEnd = bakuLocalToUtc(dateKey, 24 * 60);
    const segmentEnd = end < dayEnd ? end : dayEnd;

    const segStartMin = getBakuMinutes(cursor);
    const segEndMin =
      segmentEnd < dayEnd ? getBakuMinutes(segmentEnd) : 24 * 60;

    if (!minuteRangeContains(windows, segStartMin, segEndMin)) {
      const unavailable = hasUnavailableOverlap(
        slots,
        dateKey,
        dayOfWeek,
        segStartMin,
        segEndMin,
      );
      return {
        ok: false,
        reason: unavailable ? 'unavailable_block' : 'outside_hours',
      };
    }

    cursor = segmentEnd;
  }

  return { ok: true };
}

function hasUnavailableOverlap(
  slots: AvailabilitySlotRow[],
  dateKey: string,
  dayOfWeek: number,
  start: number,
  end: number,
): boolean {
  const unavail = slotsToMinuteRanges(
    slots,
    (s) => {
      if (s.slotType !== AssigneeAvailabilitySlotType.UNAVAILABLE) {
        return false;
      }
      if (s.kind === AssigneeAvailabilityKind.WEEKLY) {
        return s.dayOfWeek === dayOfWeek;
      }
      return (
        s.kind === AssigneeAvailabilityKind.DATE &&
        !!s.date &&
        dateKeyFromSlot(s.date) === dateKey
      );
    },
  );
  return unavail.some((u) => u.start < end && u.end > start);
}

export function findFreeMinuteIntervalsInWindows(
  windows: MinuteRange[],
  busyUtc: Array<{ start: Date; end: Date }>,
  windowStart: Date,
  windowEnd: Date,
  durationMinutes: number,
): Array<{ startsAt: string; endsAt: string }> {
  const durationMs = durationMinutes * 60 * 1000;
  const slots: Array<{ startsAt: string; endsAt: string }> = [];

  const dateKey = toBakuDateKey(windowStart);
  for (const w of windows) {
    const rangeStart = bakuLocalToUtc(dateKey, w.start);
    const rangeEnd = bakuLocalToUtc(dateKey, w.end);

    const segStart = new Date(
      Math.max(rangeStart.getTime(), windowStart.getTime()),
    );
    const segEnd = new Date(
      Math.min(rangeEnd.getTime(), windowEnd.getTime()),
    );
    if (segEnd <= segStart) continue;

    const dayBusy = busyUtc
      .filter(
        (b) =>
          b.start < segEnd &&
          b.end > segStart,
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let cursor = segStart.getTime();
    for (const task of dayBusy) {
      const busyStart = Math.max(task.start.getTime(), segStart.getTime());
      const busyEnd = Math.min(task.end.getTime(), segEnd.getTime());
      if (busyStart - cursor >= durationMs) {
        slots.push({
          startsAt: new Date(cursor).toISOString(),
          endsAt: new Date(busyStart).toISOString(),
        });
      }
      cursor = Math.max(cursor, busyEnd);
    }
    if (segEnd.getTime() - cursor >= durationMs) {
      slots.push({
        startsAt: new Date(cursor).toISOString(),
        endsAt: new Date(segEnd).toISOString(),
      });
    }
  }

  return slots;
}

export function clipWindowsToUtcRange(
  dateKey: string,
  windows: MinuteRange[],
  rangeStart: Date,
  rangeEnd: Date,
): MinuteRange[] {
  const dayStart = bakuLocalToUtc(dateKey, 0);
  const dayEnd = bakuLocalToUtc(dateKey, 24 * 60);
  if (rangeEnd <= dayStart || rangeStart >= dayEnd) return [];

  const clipped: MinuteRange[] = [];
  for (const w of windows) {
    const wStart = bakuLocalToUtc(dateKey, w.start);
    const wEnd = bakuLocalToUtc(dateKey, w.end);
    const start = Math.max(wStart.getTime(), rangeStart.getTime());
    const end = Math.min(wEnd.getTime(), rangeEnd.getTime());
    if (end > start) {
      clipped.push({
        start: getBakuMinutes(new Date(start)),
        end: getBakuMinutes(new Date(end)),
      });
    }
  }
  return mergeMinuteRanges(clipped);
}

export function combineDayWindows(
  allWindows: MinuteRange[],
  dayWindows: MinuteRange[],
): MinuteRange[] {
  return intersectMinuteRanges(allWindows, dayWindows);
}
