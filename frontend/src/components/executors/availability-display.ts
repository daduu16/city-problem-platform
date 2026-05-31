import { az } from '@/i18n/az';
import type { AssigneeAvailabilityCalendarDay, AvailabilityDayStatus } from '@/types';
import { minutesToTimeInput } from './availability-utils';

export const AVAILABILITY_STATUS_CLASS: Record<AvailabilityDayStatus, string> = {
  open: 'bg-emerald-500 hover:bg-emerald-600',
  partial: 'bg-amber-400 hover:bg-amber-500',
  closed: 'bg-zinc-400 hover:bg-zinc-500',
  off: 'border border-border bg-secondary hover:bg-muted',
  busy: 'bg-red-500 hover:bg-red-600',
};

export const AVAILABILITY_STATUS_RING: Record<AvailabilityDayStatus, string> = {
  open: 'ring-emerald-600/40',
  partial: 'ring-amber-600/40',
  closed: 'ring-zinc-600/40',
  off: 'ring-border',
  busy: 'ring-red-600/40',
};

export function formatMinuteRange(startMinute: number, endMinute: number): string {
  if (endMinute <= startMinute) return '—';
  return `${minutesToTimeInput(startMinute)}–${minutesToTimeInput(endMinute)}`;
}

export function dayTooltip(
  assigneeName: string,
  day: AssigneeAvailabilityCalendarDay,
): string {
  const status = day.status ?? 'off';
  const lines = [
    `${assigneeName} — ${day.date}`,
    az.availabilityOverview.status[status],
  ];
  if (day.hasDateOverride) {
    lines.push(az.availabilityOverview.dateOverrideInTooltip);
  }
  const windows = day.effectiveWindows.filter((w) => w.endMinute > w.startMinute);
  if (windows.length > 0) {
    lines.push(
      `${az.availabilityOverview.workHours}: ${windows
        .map((w) => formatMinuteRange(w.startMinute, w.endMinute))
        .join(', ')}`,
    );
  }
  if (day.unavailableBlocks.length > 0) {
    lines.push(
      `${az.availabilityOverview.unavailableBlocks}: ${day.unavailableBlocks
        .filter((u) => u.endMinute > u.startMinute)
        .map((u) => formatMinuteRange(u.startMinute, u.endMinute))
        .join(', ')}`,
    );
  }
  if (day.tasks.length > 0) {
    lines.push(`${day.tasks.length} ${az.availabilityOverview.tasksOnDay}`);
    for (const t of day.tasks.slice(0, 3)) {
      lines.push(`• ${t.title}`);
    }
    if (day.tasks.length > 3) {
      lines.push(`… +${day.tasks.length - 3}`);
    }
  }
  return lines.join('\n');
}
