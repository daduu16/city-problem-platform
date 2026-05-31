/** All scheduling UI uses Asia/Baku local time; API stores UTC instants. */
export const BAKU_TZ = 'Asia/Baku';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function toBakuDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: BAKU_TZ });
}

export function getBakuMinutes(d: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BAKU_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

/** Convert Baku calendar date + minute-of-day to UTC instant. */
export function bakuLocalToUtc(dateKey: string, minutes: number): Date {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return new Date(`${dateKey}T${pad2(hh)}:${pad2(mm)}:00+04:00`);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return utc.toISOString().slice(0, 10);
}

export function todayDateKey(): string {
  return toBakuDateKey(new Date());
}

/** Calendar cell anchor (noon Baku) for a date key. */
export function dateKeyToCalendarDate(dateKey: string): Date {
  return bakuLocalToUtc(dateKey, 12 * 60);
}

/** Map DayPicker selection to Baku date key. */
export function calendarDateToDateKey(day: Date): string {
  return toBakuDateKey(day);
}

export function utcToIsoString(value: Date | undefined): string {
  return value ? value.toISOString() : '';
}

export function parseUtcIso(iso: string | undefined): Date | undefined {
  if (!iso?.trim()) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function formatBakuDateTime(d: Date): string {
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: BAKU_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatBakuDate(dateKey: string): string {
  return formatBakuDateTime(dateKeyToCalendarDate(dateKey));
}

export function formatBakuTime(d: Date): string {
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: BAKU_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function roundBakuMinutesUp(minutes: number, step = 15): number {
  return Math.min(24 * 60 - step, Math.ceil(minutes / step) * step);
}

/** Default task start: next 15-min slot at least 1h from now (Baku). */
export function defaultTaskStartUtc(): Date {
  const now = new Date();
  let dateKey = toBakuDateKey(now);
  let minutes = getBakuMinutes(now) + 60;
  if (minutes >= 24 * 60) {
    dateKey = addDaysToDateKey(dateKey, 1);
    minutes -= 24 * 60;
  }
  minutes = roundBakuMinutesUp(minutes, 15);
  return bakuLocalToUtc(dateKey, minutes);
}

export function addUtcMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

export const MINUTE_STEP_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;

export function buildMinuteOptions(step: 5 | 10 | 15 = 15): string[] {
  const out: string[] = [];
  for (let m = 0; m < 60; m += step) {
    out.push(pad2(m));
  }
  return out;
}

export function buildHourOptions(): string[] {
  return Array.from({ length: 24 }, (_, i) => pad2(i));
}

export function snapBakuDateTime(d: Date, minuteStep = 15): Date {
  const dateKey = toBakuDateKey(d);
  const minutes = roundBakuMinutesUp(getBakuMinutes(d), minuteStep);
  return bakuLocalToUtc(dateKey, minutes);
}
