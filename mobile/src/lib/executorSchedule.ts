import type { MobileScheduleTask } from '@/types';

const BAKU_TZ = 'Asia/Baku';

export function todayDateKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: BAKU_TZ });
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return utc.toISOString().slice(0, 10);
}

export function formatBakuDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: BAKU_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(anchor);
}

export function formatBakuDateTime(iso: string): string {
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: BAKU_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function formatBakuTime(iso: string): string {
  return new Intl.DateTimeFormat('az-AZ', {
    timeZone: BAKU_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

type CalendarDay = {
  date: string;
  tasks: Array<Omit<MobileScheduleTask, 'date'>>;
};

export function flattenCalendarTasks(days: CalendarDay[]): MobileScheduleTask[] {
  return days.flatMap((day) =>
    day.tasks.map((task) => ({
      ...task,
      date: day.date,
    })),
  );
}

export function taskHasMapLocation(task: MobileScheduleTask): boolean {
  const inc = task.incident;
  if (!inc) return false;
  if (inc.lat != null && inc.lng != null) return true;
  return Boolean(inc.address?.trim());
}
