import { useEffect, useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { az } from '@/i18n/az';
import {
  bakuLocalToUtc,
  buildHourOptions,
  buildMinuteOptions,
  calendarDateToDateKey,
  dateKeyToCalendarDate,
  formatBakuDateTime,
  getBakuMinutes,
  toBakuDateKey,
  utcToIsoString,
  parseUtcIso,
} from '@/lib/baku-date';
import { az as azLocale } from 'date-fns/locale';

const timeSelectClassName =
  'flex h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export type DateTimePickerProps = {
  /** UTC instant shown/edited as Baku local time. */
  value?: Date;
  onChange?: (value: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  popoverClassName?: string;
  minuteStep?: 5 | 10 | 15;
};

/** @deprecated Use utcToIsoString from @/lib/baku-date */
export function dateToIsoString(value: Date | undefined): string {
  return utcToIsoString(value);
}

export function isoStringToDate(value: string | undefined): Date | undefined {
  return parseUtcIso(value);
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = az.map.pickDateTime,
  className,
  popoverClassName,
  minuteStep = 15,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const bakuMinutes = value ? getBakuMinutes(value) : 9 * 60;
  const hour = String(Math.floor(bakuMinutes / 60)).padStart(2, '0');
  const minute = String(bakuMinutes % 60).padStart(2, '0');

  const [hourSel, setHourSel] = useState(hour);
  const [minuteSel, setMinuteSel] = useState(minute);

  useEffect(() => {
    if (!value) return;
    const m = getBakuMinutes(value);
    const snapped = Math.min(
      59,
      Math.round((m % 60) / minuteStep) * minuteStep,
    );
    setHourSel(String(Math.floor(m / 60)).padStart(2, '0'));
    setMinuteSel(String(snapped).padStart(2, '0'));
  }, [value, minuteStep]);

  const hours = useMemo(() => buildHourOptions(), []);
  const minutes = useMemo(() => buildMinuteOptions(minuteStep), [minuteStep]);

  const applyBaku = (nextDateKey: string, h: string, m: string) => {
    const parsedH = Number.parseInt(h, 10);
    const parsedM = Number.parseInt(m, 10);
    if (Number.isNaN(parsedH) || Number.isNaN(parsedM)) return;
    onChange?.(bakuLocalToUtc(nextDateKey, parsedH * 60 + parsedM));
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange?.(undefined);
      return;
    }
    applyBaku(calendarDateToDateKey(day), hourSel, minuteSel);
  };

  const handleTimeChange = (nextHour: string, nextMinute: string) => {
    setHourSel(nextHour);
    setMinuteSel(nextMinute);
    const key = value ? toBakuDateKey(value) : todayFallbackKey();
    applyBaku(key, nextHour, nextMinute);
  };

  const calendarSelected = value
    ? dateKeyToCalendarDate(toBakuDateKey(value))
    : undefined;

  const label = value != null ? formatBakuDateTime(value) : placeholder;

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-9 w-full justify-start gap-2 px-3 text-left font-normal',
              !value && 'text-muted-foreground',
              className,
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-auto p-0', popoverClassName)}
          align="start"
        >
          <Calendar
            mode="single"
            selected={calendarSelected}
            onSelect={handleDaySelect}
            defaultMonth={calendarSelected}
            locale={azLocale}
          />
          <div className="space-y-2 border-t px-3 py-3">
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {az.map.dateTimeHour}
                </Label>
                <select
                  className={timeSelectClassName}
                  value={hourSel}
                  onChange={(e) => handleTimeChange(e.target.value, minuteSel)}
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {az.map.dateTimeMinute}
                </Label>
                <select
                  className={timeSelectClassName}
                  value={minuteSel}
                  onChange={(e) => handleTimeChange(hourSel, e.target.value)}
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full"
                onClick={() => {
                  onChange?.(undefined);
                  setOpen(false);
                }}
              >
                {az.map.clearDateTime}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-[10px] text-muted-foreground">{az.tasks.bakuTimeHint}</p>
    </div>
  );
}

function todayFallbackKey(): string {
  return toBakuDateKey(new Date());
}
