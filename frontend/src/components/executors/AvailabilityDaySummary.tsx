import { format, parseISO } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';

import { az } from '@/i18n/az';
import type { AssigneeAvailabilityCalendarDay } from '@/types';
import { cn } from '@/lib/utils';
import {
  AVAILABILITY_STATUS_CLASS,
  formatMinuteRange,
} from './availability-display';

type Props = {
  day: AssigneeAvailabilityCalendarDay;
};

const STATUS_HINT: Record<
  NonNullable<AssigneeAvailabilityCalendarDay['status']>,
  string
> = {
  open: az.availabilityOverview.dayHint.open,
  partial: az.availabilityOverview.dayHint.partial,
  closed: az.availabilityOverview.dayHint.closed,
  off: az.availabilityOverview.dayHint.off,
  busy: az.availabilityOverview.dayHint.busy,
};

export function AvailabilityDaySummary({ day }: Props) {
  const status = day.status ?? 'off';
  const windows = day.effectiveWindows.filter((w) => w.endMinute > w.startMinute);

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {az.availabilityOverview.dayContextTitle}
          </p>
          <p className="text-sm font-semibold">
            {format(parseISO(day.date), 'EEEE, d MMMM yyyy', { locale: azLocale })}
          </p>
        </div>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium text-white',
            AVAILABILITY_STATUS_CLASS[status],
            status === 'off' && 'text-foreground',
          )}
        >
          {az.availabilityOverview.status[status]}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{STATUS_HINT[status]}</p>

      {day.hasDateOverride ? (
        <p className="text-xs text-primary">{az.availabilityOverview.hasOverride}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{az.availabilityOverview.usesWeekly}</p>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {az.availabilityOverview.effectiveHours}
        </p>
        {windows.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-0.5 text-sm">
            {windows.map((w, i) => (
              <li key={i}>{formatMinuteRange(w.startMinute, w.endMinute)}</li>
            ))}
          </ul>
        )}
      </div>

      {day.unavailableBlocks.some((b) => b.endMinute > b.startMinute) && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {az.availabilityOverview.unavailableBlocks}
          </p>
          <ul className="space-y-0.5 text-sm text-amber-800 dark:text-amber-300">
            {day.unavailableBlocks
              .filter((b) => b.endMinute > b.startMinute)
              .map((b, i) => (
                <li key={i}>{formatMinuteRange(b.startMinute, b.endMinute)}</li>
              ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {az.availabilityOverview.scheduledTasks}
        </p>
        {day.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{az.availabilityOverview.noTasks}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {day.tasks.map((t) => (
              <li key={t.id} className="rounded border bg-card px-2 py-1">
                <span className="font-medium">{t.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {format(new Date(t.startsAt), 'HH:mm', { locale: azLocale })}
                  {' – '}
                  {format(new Date(t.endsAt), 'HH:mm', { locale: azLocale })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
