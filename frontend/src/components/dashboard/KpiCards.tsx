import type { DashboardKpis } from '@/types';
import { az } from '@/i18n/az';
import { AlertTriangle, Clock, PlusCircle, Percent, Wrench, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

type KpiAccent = 'blue' | 'red' | 'amber' | 'violet' | 'orange' | 'emerald';

const KPI_ICON: Record<KpiAccent, string> = {
  blue: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25',
  red: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25',
  amber: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25',
  violet: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25',
  orange: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25',
};

const cards: Array<{
  key: keyof DashboardKpis;
  label: string;
  icon: typeof Zap;
  accent: KpiAccent;
  suffix?: string;
}> = [
  { key: 'activeProblems', label: az.dashboard.kpiActive, icon: Zap, accent: 'blue' },
  { key: 'overdueTasks', label: az.dashboard.kpiOverdue, icon: AlertTriangle, accent: 'red' },
  { key: 'newToday', label: az.dashboard.kpiNewToday, icon: PlusCircle, accent: 'amber' },
  {
    key: 'avgResolutionHours',
    label: az.dashboard.kpiAvgResolution,
    icon: Clock,
    accent: 'violet',
    suffix: az.dashboard.hourSuffix,
  },
  { key: 'accidentsCount', label: az.dashboard.kpiCritical, icon: Wrench, accent: 'orange' },
  { key: 'slaPercent', label: az.dashboard.kpiSla, icon: Percent, accent: 'emerald', suffix: '%' },
];

export function KpiCards({ data }: { data: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ key, label, icon: Icon, accent, suffix }) => (
        <Card
          key={key}
          className="group relative overflow-hidden border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30"
        >
          <div
            className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${KPI_ICON[accent]}`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {data[key]}
            {suffix && <span className="ml-0.5 text-base text-muted-foreground">{suffix}</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}
