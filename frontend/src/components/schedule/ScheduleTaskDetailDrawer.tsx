import { ExternalLink, MapPin } from 'lucide-react';
import type { ScheduleTaskView } from '@/types';
import { SlideDrawer } from '@/components/ui/slide-drawer';
import { ScheduleTaskMap } from '@/components/schedule/ScheduleTaskMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { az } from '@/i18n/az';
import { formatBakuDate, formatBakuDateTime } from '@/lib/baku-date';
import { formatPriority, formatStatus } from '@/lib/format';
import { openMapsRoute } from '@/lib/mapsRoute';
import { taskHasMapLocation } from '@/lib/scheduleTasks';

type Props = {
  task: ScheduleTaskView | null;
  onClose: () => void;
};

function taskStatusLabel(status: string): string {
  return status in az.schedule.taskStatus
    ? az.schedule.taskStatus[status as keyof typeof az.schedule.taskStatus]
    : status;
}

export function ScheduleTaskDetailDrawer({ task, onClose }: Props) {
  return (
    <SlideDrawer
      item={task}
      onClose={onClose}
      render={(t) => {
        const incident = t.incident;
        const canRoute = taskHasMapLocation(t);

        return (
          <div className="flex h-full flex-col overflow-hidden pt-12">
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <h2 className="pr-8 text-lg font-semibold leading-snug">{t.title}</h2>
              {incident?.title && incident.title !== t.title && (
                <p className="mt-1 text-sm text-muted-foreground">{incident.title}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">{taskStatusLabel(t.status)}</Badge>
                {t.scheduleType && (
                  <Badge variant="outline">{t.scheduleType}</Badge>
                )}
                {incident?.priority && (
                  <Badge variant="outline">{formatPriority(incident.priority)}</Badge>
                )}
                {incident?.status && (
                  <Badge variant="outline">{formatStatus(incident.status)}</Badge>
                )}
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {az.schedule.detailDate}
                  </dt>
                  <dd className="mt-1 font-medium">{formatBakuDate(t.date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {az.schedule.detailTime}
                  </dt>
                  <dd className="mt-1">
                    {formatBakuDateTime(new Date(t.startsAt))}
                    {' — '}
                    {formatBakuDateTime(new Date(t.endsAt))}
                  </dd>
                </div>
                {incident?.address && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {az.schedule.detailLocation}
                    </dt>
                    <dd className="mt-1 flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{incident.address}</span>
                    </dd>
                  </div>
                )}
                {incident?.lat != null && incident?.lng != null && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {az.schedule.detailCoords}
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-muted-foreground">
                      {incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}
                    </dd>
                  </div>
                )}
              </dl>

              <Separator className="my-6" />

              <section>
                <h3 className="text-sm font-semibold">{az.schedule.detailDescription}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {(
                    t.description?.trim() ||
                    incident?.description?.trim() ||
                    ''
                  ) || az.schedule.detailNoDescription}
                </p>
              </section>

              {canRoute && (
                <section className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold">{az.schedule.mapTitle}</h3>
                  <ScheduleTaskMap tasks={[t]} className="h-[200px]" />
                </section>
              )}
            </div>

            <div className="border-t bg-muted/30 px-6 py-4">
              <Button
                type="button"
                className="w-full"
                disabled={!canRoute}
                onClick={() =>
                  openMapsRoute({
                    lat: incident?.lat,
                    lng: incident?.lng,
                    address: incident?.address,
                  })
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {az.schedule.openRoute}
              </Button>
            </div>
          </div>
        );
      }}
    />
  );
}
