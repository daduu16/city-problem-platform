import { format, parseISO } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type DateRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  numberOfMonths?: number;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  className,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const label =
    value?.from != null
      ? value.to != null
        ? `${format(value.from, 'dd MMM yyyy', { locale: azLocale })} – ${format(value.to, 'dd MMM yyyy', { locale: azLocale })}`
        : format(value.from, 'dd MMM yyyy', { locale: azLocale })
      : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 justify-start gap-2 px-3 text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
          locale={azLocale}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Map store uses `yyyy-MM-dd` strings; calendar uses `Date`. */
export function dateRangeFromStore(
  from: string | null,
  to: string | null,
): DateRange | undefined {
  if (!from && !to) return undefined;
  return {
    from: from ? parseISO(from) : undefined,
    to: to ? parseISO(to) : undefined,
  };
}

export function dateRangeToStore(range: DateRange | undefined): {
  from: string | null;
  to: string | null;
} {
  if (!range?.from && !range?.to) {
    return { from: null, to: null };
  }
  return {
    from: range.from ? format(range.from, 'yyyy-MM-dd') : null,
    to: range.to ? format(range.to, 'yyyy-MM-dd') : null,
  };
}
