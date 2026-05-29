import type { DashboardKpis } from '@/types';
import { az } from '@/i18n/az';
import { AlertTriangle, Clock, PlusCircle, Percent, Wrench, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

type Accent = 'blue' | 'red' | 'amber' | 'violet' | 'orange' | 'emerald';

const ACCENTS: Record<Accent, string> = {
  blue: 'bg-blue-500/12 text-blue-400 ring-blue-500/20',
  red: 'bg-red-500/12 text-red-400 ring-red-500/20',
  amber: 'bg-amber-500/12 text-amber-400 ring-amber-500/20',
  violet: 'bg-violet-500/12 text-violet-400 ring-violet-500/20',
  orange: 'bg-orange-500/12 text-orange-400 ring-orange-500/20',
  emerald: 'bg-emerald-500/12 text-emerald-400 ring-emerald-500/20',
};

const cards: Array<{
  key: keyof DashboardKpis;
  label: string;
  icon: typeof Zap;
  accent: Accent;
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
          className="group relative overflow-hidden p-4 transition-all duration-200 hover:border-border/80 hover:shadow-lg hover:shadow-black/20"
        >
          <div
            className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${ACCENTS[accent]}`}
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
