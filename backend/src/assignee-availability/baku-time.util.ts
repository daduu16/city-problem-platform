export const BAKU_TZ = 'Asia/Baku';

const WEEKDAY_MON0: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function toBakuDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: BAKU_TZ });
}

export function getBakuWeekdayMon0(d: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BAKU_TZ,
    weekday: 'short',
  }).formatToParts(d);
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  return WEEKDAY_MON0[wd] ?? 0;
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

export function bakuLocalToUtc(dateKey: string, minutes: number): Date {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return new Date(
    `${dateKey}T${pad(hh)}:${pad(mm)}:00+04:00`,
  );
}

export function addBakuDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return utc.toISOString().slice(0, 10);
}

export function enumerateBakuDateKeys(from: Date, to: Date): string[] {
  let key = toBakuDateKey(from);
  const endKey = toBakuDateKey(to);
  const keys: string[] = [];
  while (key <= endKey) {
    keys.push(key);
    key = addBakuDays(key, 1);
  }
  return keys;
}

export function dateKeyFromDbDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
