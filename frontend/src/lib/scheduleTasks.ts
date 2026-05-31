import type {
  AssigneeAvailabilityCalendar,
  AssigneeAvailabilityCalendarDay,
  ScheduleTaskView,
} from '@/types';

export function getMonthRangeFromDateKey(dateKey: string): {
  from: string;
  to: string;
} {
  const [y, m] = dateKey.split('-');
  const year = Number(y);
  const month = Number(m);
  const from = `${y}-${m}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export function shiftMonthDateKey(dateKey: string, deltaMonths: number): string {
  const [y, m] = dateKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + deltaMonths, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}-01`;
}

export function flattenCalendarTasks(
  days: AssigneeAvailabilityCalendarDay[],
): ScheduleTaskView[] {
  return days.flatMap((day) =>
    day.tasks.map((task) => ({
      ...task,
      date: day.date,
    })),
  );
}

export function tasksForDate(
  calendar: AssigneeAvailabilityCalendar | undefined,
  dateKey: string,
): ScheduleTaskView[] {
  const day = calendar?.days.find((d) => d.date === dateKey);
  if (!day) return [];
  return day.tasks.map((task) => ({ ...task, date: day.date }));
}

export function taskHasMapLocation(task: ScheduleTaskView): boolean {
  const inc = task.incident;
  if (!inc) return false;
  if (inc.lat != null && inc.lng != null) return true;
  return Boolean(inc.address?.trim());
}

export function taskMapCoords(
  task: ScheduleTaskView,
): { lat: number; lng: number } | null {
  const inc = task.incident;
  if (!inc || inc.lat == null || inc.lng == null) return null;
  if (!Number.isFinite(inc.lat) || !Number.isFinite(inc.lng)) return null;
  return { lat: inc.lat, lng: inc.lng };
}
