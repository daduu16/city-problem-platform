import { useMemo, type ReactNode } from 'react';
import { AlertCircle, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { az } from '@/i18n/az';
import {
  buildDashboardInsight,
  timelineWeekChangePercent,
} from '@/lib/dashboardInsights';
import type { DashboardKpis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  kpis: DashboardKpis;
  timelineCounts: number[];
};

const insightStyles = {
  warning: 'border-destructive/30 bg-destructive/5 text-destructive',
  positive: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  neutral: 'border-border/60 bg-muted/30 text-foreground',
} as const;

export function EventsOverviewPanel({ kpis, timelineCounts }: Props) {
  const insight = useMemo(
    () => buildDashboardInsight(kpis, timelineCounts),
    [kpis, timelineCounts],
  );
  const weekTrend = useMemo(() => timelineWeekChangePercent(timelineCounts), [timelineCounts]);

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{az.dashboard.eventsOverview}</CardTitle>
        <p className="text-xs text-muted-foreground">{az.dashboard.eventsOverviewHint}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className={cn(
            'flex gap-3 rounded-lg border px-3 py-2.5 text-sm leading-snug',
            insightStyles[insight.tone],
          )}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
          <p>{insight.message}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OverviewMetric label={az.dashboard.metricOpen} value={kpis.activeProblems} />
          <OverviewMetric
            label={az.dashboard.kpiOverdue}
            value={kpis.overdueTasks}
            highlight={kpis.overdueTasks > 0}
          />
          <OverviewMetric
            label={az.dashboard.kpiResolutionRate}
            value={`${kpis.resolutionRate}%`}
          />
          <OverviewMetric
            label={az.dashboard.metricWeekTrend}
            value={
              weekTrend == null ? '—' : `${weekTrend > 0 ? '+' : ''}${weekTrend}%`
            }
            icon={
              weekTrend == null ? (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              ) : weekTrend > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
              ) : weekTrend < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )
            }
          />
        </div>

      </CardContent>
    </Card>
  );
}

function OverviewMetric({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 flex items-center gap-1 text-xl font-semibold tabular-nums',
          highlight && 'text-destructive',
        )}
      >
        {value}
        {icon}
      </p>
    </div>
  );
}
