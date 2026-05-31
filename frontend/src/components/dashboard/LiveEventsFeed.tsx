import { useMemo } from 'react';
import { az } from '@/i18n/az';
import { formatCategory, formatRelativeTime, formatStatus } from '@/lib/format';
import { getPriorityStyle, getStatusStyle } from '@/lib/incidentStyles';
import type { RecentEventRow } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  events: RecentEventRow[];
  onEventClick?: (incidentId: string) => void;
};

export function LiveEventsFeed({ events, onEventClick }: Props) {
  const criticalCount = useMemo(
    () => events.filter((e) => e.priority === 'CRITICAL').length,
    [events],
  );

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-semibold">{az.dashboard.liveEvents}</CardTitle>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {events.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {az.dashboard.liveEventsCount(events.length)}
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-[10px] font-normal">
              {az.dashboard.liveEventsUrgent(criticalCount)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {events.length === 0 ? (
          <p className="px-6 py-6 text-center text-sm text-muted-foreground">
            {az.dashboard.noData}
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {events.map((event) => {
              const statusStyle = getStatusStyle(event.status);
              const priorityStyle = getPriorityStyle(event.priority);
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onEventClick?.(event.id)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: statusStyle.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {formatCategory(event.category)}
                        {event.address ? ` · ${event.address.split(',')[0]}` : ''}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={cn('rounded px-1.5 py-0.5', statusStyle.badgeClass)}>
                          {formatStatus(event.status)}
                        </span>
                        <span style={{ color: priorityStyle.color }}>
                          {priorityStyle.label}
                        </span>
                      </div>
                    </div>
                    <time className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(event.updatedAt)}
                    </time>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
