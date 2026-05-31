import { format } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import type { Matcher } from 'react-day-picker';

import { az } from '@/i18n/az';
import type { AssigneeAvailabilityCalendarDay } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { dateKeyToDate } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import {
  AVAILABILITY_STATUS_CLASS,
  AVAILABILITY_STATUS_RING,
} from './availability-display';

type Props = {
  days: AssigneeAvailabilityCalendarDay[];
  selectedDate?: string | null;
  onSelectDate?: (dateKey: string) => void;
  fromDateKey: string;
  toDateKey: string;
  className?: string;
};

export function AssigneeAvailabilityCalendar({
  days,
  selectedDate,
  onSelectDate,
  fromDateKey,
  toDateKey,
  className,
}: Props) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const selected = selectedDate ? dateKeyToDate(selectedDate) : undefined;
  const from = dateKeyToDate(fromDateKey);
  const to = dateKeyToDate(toDateKey);

  const statusMatchers = (status: NonNullable<AssigneeAvailabilityCalendarDay['status']>): Matcher => (
    date,
  ) => (byDate.get(format(date, 'yyyy-MM-dd'))?.status ?? 'off') === status;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">{az.availabilityOverview.calendarView}</p>
      <div className="overflow-x-auto rounded-md border bg-card p-2">
        <Calendar
          mode="single"
          numberOfMonths={2}
          locale={azLocale}
          selected={selected}
          defaultMonth={selected ?? from}
          onSelect={(day) => onSelectDate?.(day ? format(day, 'yyyy-MM-dd') : '')}
          disabled={[{ before: from }, { after: to }]}
          modifiers={{
            open: statusMatchers('open'),
            partial: statusMatchers('partial'),
            closed: statusMatchers('closed'),
            off: statusMatchers('off'),
            busy: statusMatchers('busy'),
          }}
          modifiersClassNames={{
            open: cn(AVAILABILITY_STATUS_CLASS.open, 'text-white rounded-md'),
            partial: cn(AVAILABILITY_STATUS_CLASS.partial, 'text-white rounded-md'),
            closed: cn(AVAILABILITY_STATUS_CLASS.closed, 'text-white rounded-md'),
            off: cn(AVAILABILITY_STATUS_CLASS.off, 'rounded-md'),
            busy: cn(AVAILABILITY_STATUS_CLASS.busy, 'text-white rounded-md'),
            selected: cn('ring-2 ring-primary ring-offset-2', AVAILABILITY_STATUS_RING.open),
          }}
          classNames={{
            day: 'h-10 w-10',
            day_button: 'h-10 w-10',
          }}
        />
      </div>
    </div>
  );
}
