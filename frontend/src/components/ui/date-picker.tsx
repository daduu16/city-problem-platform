import { format } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { Matcher } from 'react-day-picker';

import {
  calendarDateToDateKey,
  dateKeyToCalendarDate,
} from '@/lib/baku-date';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type DatePickerProps = {
  /** `yyyy-MM-dd` Baku calendar date key. */
  value?: string | null;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
};

export function dateKeyToDate(key: string): Date {
  return dateKeyToCalendarDate(key);
}

export function dateToDateKey(date: Date): string {
  return calendarDateToDateKey(date);
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Tarix seçin',
  className,
  disabled,
  fromDate,
  toDate,
}: DatePickerProps) {
  const selected = value ? dateKeyToDate(value) : undefined;

  const disabledMatchers: Matcher[] = [];
  if (fromDate) disabledMatchers.push({ before: fromDate });
  if (toDate) disabledMatchers.push({ after: toDate });

  const label =
    selected != null
      ? format(selected, 'dd MMM yyyy', { locale: azLocale })
      : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 justify-start gap-2 px-3 text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(day) => onChange?.(day ? dateToDateKey(day) : undefined)}
          locale={azLocale}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
