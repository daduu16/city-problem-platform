import { format } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import {
  ArrowRight,
  MessageSquare,
  UserPlus,
  UserRound,
  FilePlus2,
  RefreshCw,
} from 'lucide-react';
import type { IncidentDetail } from '@/types';
import { az } from '@/i18n/az';
import {
  formatHistoryDetail,
  formatHistoryTitle,
} from '@/lib/historyDisplay';
import { getHistoryEventStyle } from '@/lib/historyEventStyles';
import { formatStatus } from '@/lib/format';
import { getStatusStyle } from '@/lib/incidentStyles';
import type { IncidentStatus } from '@/types';

type HistoryItem = IncidentDetail['history'][number];

const STATUS_VALUES = new Set<string>([
  'NEW',
  'IN_PROGRESS',
  'PENDING',
  'RESOLVED',
  'OVERDUE',
  'ARCHIVED',
]);

function HistoryIcon({ actionType }: { actionType: string }) {
  const className = 'h-3.5 w-3.5 shrink-0 opacity-90';
  switch (actionType) {
    case 'CITIZEN_REPORT':
      return <UserRound className={className} />;
    case 'CREATED':
      return <FilePlus2 className={className} />;
    case 'ASSIGNED':
      return <UserPlus className={className} />;
    case 'COMMENT':
      return <MessageSquare className={className} />;
    case 'STATUS_CHANGED':
      return <RefreshCw className={className} />;
    default:
      return <RefreshCw className={className} />;
  }
}

function StatusPill({ status }: { status: string }) {
  if (!STATUS_VALUES.has(status)) return null;
  const style = getStatusStyle(status as IncidentStatus);
  return (
    <span
      className="inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        color: style.color,
        borderColor: style.border,
        backgroundColor: style.bg,
      }}
    >
      {formatStatus(status as IncidentStatus)}
    </span>
  );
}

function StatusChangeDetail({
  oldValue,
  newValue,
}: {
  oldValue?: string | null;
  newValue?: string | null;
}) {
  const from = oldValue && STATUS_VALUES.has(oldValue) ? oldValue : null;
  const to = newValue && STATUS_VALUES.has(newValue) ? newValue : null;
  if (!from && !to) {
    return (
      <p className="text-sm text-foreground/90">
        {formatHistoryDetail('STATUS_CHANGED', oldValue, newValue)}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      {from && <StatusPill status={from} />}
      {from && to && (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      )}
      {to && <StatusPill status={to} />}
    </div>
  );
}

function TimelineEventBody({ item }: { item: HistoryItem }) {
  if (item.actionType === 'STATUS_CHANGED') {
    return (
      <StatusChangeDetail oldValue={item.oldValue} newValue={item.newValue} />
    );
  }

  const detail = formatHistoryDetail(
    item.actionType,
    item.oldValue,
    item.newValue,
  );
  if (!detail) return null;

  return <p className="text-sm leading-relaxed text-foreground/90">{detail}</p>;
}

function actorRoleLabel(actionType: string): string | null {
  switch (actionType) {
    case 'CITIZEN_REPORT':
      return az.drawer.actorCitizen;
    case 'CREATED':
    case 'ASSIGNED':
      return az.drawer.actorDispatcher;
    case 'STATUS_CHANGED':
      return az.drawer.actorExecutor;
    case 'COMMENT':
      return az.drawer.actorStaff;
    default:
      return null;
  }
}

interface Props {
  history: HistoryItem[];
  reporterCount?: number;
}

export function IncidentTimeline({ history, reporterCount }: Props) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{az.drawer.timelineEmpty}</p>
    );
  }

  return (
    <div>
      {reporterCount != null && reporterCount > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          {az.drawer.reportersHint} · {az.drawer.reportersTitle(reporterCount)}
        </p>
      )}
      <ol className="relative space-y-0">
        {history.map((item, index) => {
          const style = getHistoryEventStyle(item.actionType, item.newValue);
          const isLast = index === history.length - 1;
          const roleLabel = actorRoleLabel(item.actionType);

          return (
            <li key={item.id} className="relative flex gap-3 pb-5">
              {!isLast && (
                <span
                  className="absolute left-[7px] top-4 bottom-0 w-0.5"
                  style={{ backgroundColor: style.lineColor }}
                  aria-hidden
                />
              )}
              <span
                className="relative z-[1] mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-2 ring-background"
                style={{ backgroundColor: style.dotColor }}
                aria-hidden
              >
                <span className="h-1.5 w-1.5 rounded-full bg-background/90" />
              </span>
              <div
                className="min-w-0 flex-1 rounded-lg border px-3 py-2.5"
                style={{
                  backgroundColor: style.cardBg,
                  borderColor: style.cardBorder,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <HistoryIcon actionType={item.actionType} />
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: style.titleColor }}
                    >
                      {formatHistoryTitle(item.actionType)}
                    </span>
                  </div>
                  <time
                    className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
                    dateTime={item.createdAt}
                  >
                    {format(new Date(item.createdAt), 'PPp', {
                      locale: azLocale,
                    })}
                  </time>
                </div>

                <div className="mt-2">
                  <TimelineEventBody item={item} />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/85">
                    {item.createdBy.name}
                  </span>
                  {roleLabel && (
                    <span className="text-muted-foreground"> · {roleLabel}</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
