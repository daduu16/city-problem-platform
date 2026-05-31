export function minutesToTimeInput(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function timeInputToMinutes(value: string): number {
  const [h, min] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return 0;
  return h * 60 + min;
}

export const MAX_AVAILABILITY_RANGE_DAYS = 63;

import { addDaysToDateKey as addBakuDays, todayDateKey as bakuToday } from '@/lib/baku-date';

export function todayDateKey(): string {
  return bakuToday();
}

export function dayCountInclusive(fromKey: string, toKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);
  return Math.floor((end - start) / 86400000) + 1;
}

/** Caps `to` so the inclusive span is at most `maxDays`. */
export function clampRangeEnd(
  fromKey: string,
  toKey: string,
  maxDays: number = MAX_AVAILABILITY_RANGE_DAYS,
): string {
  if (dayCountInclusive(fromKey, toKey) <= maxDays) return toKey;
  return addDaysToDateKey(fromKey, maxDays - 1);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  return addBakuDays(dateKey, days);
}

export type AvailabilityDraftSlot = {
  clientId: string;
  kind: 'WEEKLY' | 'DATE';
  dayOfWeek?: number;
  date?: string;
  slotType: 'AVAILABLE' | 'UNAVAILABLE';
  startMinute: number;
  endMinute: number;
  label?: string;
};

export function slotFromApi(
  s: import('@/types').AssigneeAvailabilitySlot,
): AvailabilityDraftSlot {
  return {
    clientId: s.id,
    kind: s.kind,
    dayOfWeek: s.dayOfWeek ?? undefined,
    date: s.date ?? undefined,
    slotType: s.slotType,
    startMinute: s.startMinute,
    endMinute: s.endMinute,
    label: s.label ?? undefined,
  };
}

export function isClosedDayMarker(slot: {
  slotType: string;
  startMinute: number;
  endMinute: number;
}): boolean {
  return slot.slotType === 'AVAILABLE' && slot.endMinute === slot.startMinute;
}

export function draftToPayload(slots: AvailabilityDraftSlot[]) {
  return slots.map((s) => ({
    kind: s.kind,
    dayOfWeek: s.kind === 'WEEKLY' ? s.dayOfWeek : undefined,
    date: s.kind === 'DATE' ? s.date : undefined,
    slotType: s.slotType,
    startMinute: s.startMinute,
    endMinute: s.endMinute,
    label: s.label,
  }));
}

/** Non-closed slots must have end > start. */
export function validateAvailabilityDraft(slots: AvailabilityDraftSlot[]): boolean {
  for (const s of slots) {
    if (isClosedDayMarker(s)) continue;
    if (s.endMinute <= s.startMinute) return false;
  }
  return true;
}
