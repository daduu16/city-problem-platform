import { ExternalLink, MapPin } from 'lucide-react';
import type { ScheduleTaskView } from '@/types';
import { formatBakuDate, formatBakuDateTime } from '@/lib/baku-date';
import { openMapsRoute } from '@/lib/mapsRoute';
import { taskHasMapLocation } from '@/lib/scheduleTasks';
import { az } from '@/i18n/az';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Props = {
  tasks: ScheduleTaskView[];
  showDate?: boolean;
  emptyMessage?: string;
};

export function ScheduleTaskList({
  tasks,
  showDate = false,
  emptyMessage = az.schedule.noTasks,
}: Props) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const sorted = [...tasks].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <ul className="space-y-3">
      {sorted.map((task) => {
        const incident = task.incident;
        const canRoute = taskHasMapLocation(task);

        return (
          <li
            key={task.id}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold leading-snug">{task.title}</p>
                {incident?.title && incident.title !== task.title && (
                  <p className="text-sm text-muted-foreground">{incident.title}</p>
                )}
                {showDate && (
                  <p className="text-xs font-medium text-primary">{formatBakuDate(task.date)}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formatBakuDateTime(new Date(task.startsAt))}
                  {' — '}
                  {formatBakuDateTime(new Date(task.endsAt))}
                </p>
                {incident?.address && (
                  <p className="flex items-start gap-1.5 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{incident.address}</span>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge variant="secondary" className="text-xs">
                  {task.status}
                </Badge>
                {incident?.priority && (
                  <Badge variant="outline" className="text-xs">
                    {incident.priority}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                disabled={!canRoute}
                className={cn(!canRoute && 'opacity-50')}
                onClick={() =>
                  openMapsRoute({
                    lat: incident?.lat,
                    lng: incident?.lng,
                    address: incident?.address,
                  })
                }
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                {az.schedule.openRoute}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
