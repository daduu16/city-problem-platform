import type { DashboardKpis } from '@/types';
import { az } from '@/i18n/az';
import { AlertTriangle, CheckCircle2, Clock, Gauge, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';

type Props = {
  data: DashboardKpis;
  timelineCounts: number[];
};

const cards = [
  {
    key: 'CRITICAL' as const,
    label: az.dashboard.kpiCritical,
    value: (d: DashboardKpis) => d.priorityOpen.CRITICAL,
    color: '#ff4d4f',
    icon: ShieldAlert,
  },
  {
    key: 'HIGH' as const,
    label: az.dashboard.kpiHigh,
    value: (d: DashboardKpis) => d.priorityOpen.HIGH,
    color: '#fa8c16',
    icon: AlertTriangle,
  },
  {
    key: 'MEDIUM' as const,
    label: az.dashboard.kpiMedium,
    value: (d: DashboardKpis) => d.priorityOpen.MEDIUM,
    color: '#faad14',
    icon: Gauge,
  },
  {
    key: 'resolved' as const,
    label: az.dashboard.kpiResolvedToday,
    value: (d: DashboardKpis) => d.resolvedToday,
    color: '#52c41a',
    icon: CheckCircle2,
  },
  {
    key: 'avg' as const,
    label: az.dashboard.kpiAvgResolution,
    value: (d: DashboardKpis) => d.avgResolutionHours,
    color: '#5d5fef',
    icon: Clock,
    suffix: az.dashboard.hourSuffix,
  },
];

export function PriorityKpiCards({ data, timelineCounts }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ key, label, value, color, icon: Icon, suffix }) => (
        <Card
          key={key}
          className="border-border/60 bg-card p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
                {value(data)}
                {suffix && (
                  <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                    {suffix}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <MiniSparkline data={timelineCounts} color={color} id={key} />
          </div>
        </Card>
      ))}
    </div>
  );
}
