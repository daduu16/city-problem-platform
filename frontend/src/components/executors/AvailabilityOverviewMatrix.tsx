import { Fragment, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import { Search } from 'lucide-react';

import { az } from '@/i18n/az';
import type { AvailabilityOverview } from '@/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AVAILABILITY_STATUS_CLASS,
  dayTooltip,
} from './availability-display';
import { todayDateKey } from './availability-utils';

type Props = {
  data: AvailabilityOverview;
  search: string;
  onSearchChange: (q: string) => void;
  selectedAssigneeId: string | null;
  focusDate: string | null;
  onSelectCell: (assigneeId: string, date: string) => void;
  onSelectAssignee: (assigneeId: string) => void;
};

const ASSIGNEE_WIDTH_PX = 184;
const DATE_COL = 'w-11 shrink-0';
const ROW_H = 'h-12';
const HEADER_H = 'h-[3.5rem]';

function rowSurface(index: number, isSelected: boolean) {
  if (isSelected) {
    return 'border-b border-border bg-accent';
  }
  return cn(
    'border-b border-border',
    index % 2 === 0 ? 'bg-card' : 'bg-muted',
  );
}

function rowRingOffset(index: number, isSelected: boolean) {
  if (isSelected) return 'ring-offset-accent';
  return index % 2 === 0 ? 'ring-offset-card' : 'ring-offset-muted';
}

export function AvailabilityOverviewMatrix({
  data,
  search,
  onSearchChange,
  selectedAssigneeId,
  focusDate,
  onSelectCell,
  onSelectAssignee,
}: Props) {
  const todayKey = todayDateKey();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.assignees;
    return data.assignees.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.organization?.name.toLowerCase().includes(q),
    );
  }, [data.assignees, search]);

  const scrollToToday = () => {
    const el = scrollRef.current?.querySelector('[data-today="true"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={az.availabilityOverview.searchAssignee}
            className="h-9 pl-9"
          />
        </div>
        <button
          type="button"
          onClick={scrollToToday}
          className="text-xs font-medium text-primary hover:underline"
        >
          {az.availabilityOverview.jumpToday}
        </button>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[min(65vh,560px)] overflow-auto rounded-md border bg-card"
      >
        <div
          className="grid w-max min-w-full"
          style={{
            gridTemplateColumns: `${ASSIGNEE_WIDTH_PX}px max-content`,
          }}
        >
          {/* Header */}
          <div
            className={cn(
              'sticky left-0 top-0 z-30 flex items-center border-b border-r border-border bg-muted px-3 text-xs font-medium',
              HEADER_H,
            )}
          >
            {az.availabilityOverview.assignee}
          </div>
          <div
            className={cn(
              'sticky top-0 z-20 flex items-center gap-1.5 border-b border-border bg-muted px-2 py-2',
              HEADER_H,
            )}
          >
            {data.dates.map((d, i) => {
              const date = parseISO(d);
              const prev = i > 0 ? parseISO(data.dates[i - 1]) : null;
              const showMonth =
                i === 0 || (prev && format(prev, 'yyyy-MM') !== format(date, 'yyyy-MM'));
              const isTodayCol = d === todayKey;
              return (
                <div
                  key={d}
                  data-today={isTodayCol ? 'true' : undefined}
                  className={cn(
                    DATE_COL,
                    'flex flex-col items-center justify-center rounded-md text-center',
                    isTodayCol && 'bg-accent/80',
                  )}
                  title={format(date, 'dd MMMM yyyy', { locale: azLocale })}
                >
                  {showMonth && (
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                      {format(date, 'MMM', { locale: azLocale })}
                    </div>
                  )}
                  <div className="text-sm font-semibold">
                    {format(date, 'd', { locale: azLocale })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(date, 'EEE', { locale: azLocale })}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div
              className="col-span-2 px-4 py-10 text-center text-sm text-muted-foreground"
              style={{ gridColumn: '1 / -1' }}
            >
              {az.availabilityOverview.noSearchResults}
            </div>
          ) : (
            filtered.map((row, index) => {
              const isRowSelected = selectedAssigneeId === row.id;
              const surface = rowSurface(index, isRowSelected);
              const ringOffset = rowRingOffset(index, isRowSelected);
              return (
                <Fragment key={row.id}>
                  <div
                    className={cn(
                      'sticky left-0 z-10 flex items-center border-r border-border px-3',
                      ROW_H,
                      surface,
                      isRowSelected && 'border-l-2 border-l-primary',
                    )}
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectAssignee(row.id)}
                        className={cn(
                          'block w-full truncate text-left text-sm font-medium hover:text-primary',
                          isRowSelected && 'text-primary',
                        )}
                      >
                        {row.name}
                      </button>
                      {row.organization && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {row.organization.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-2',
                      ROW_H,
                      surface,
                    )}
                  >
                    {row.days.map((day) => {
                      const status = day.status ?? 'off';
                      const isCellSelected =
                        selectedAssigneeId === row.id && focusDate === day.date;
                      return (
                        <div
                          key={day.date}
                          className={cn(DATE_COL, 'flex items-center justify-center p-0.5')}
                        >
                          <button
                            type="button"
                            title={dayTooltip(row.name, day)}
                            onClick={() => onSelectCell(row.id, day.date)}
                            className={cn(
                              'flex h-8 w-full flex-col items-center justify-center rounded-md transition-all',
                              AVAILABILITY_STATUS_CLASS[status],
                              isCellSelected &&
                                cn('ring-2 ring-primary ring-offset-2', ringOffset),
                            )}
                          >
                            {day.tasks.length > 0 && (
                              <span className="text-[9px] font-bold text-white/95">
                                {day.tasks.length}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
