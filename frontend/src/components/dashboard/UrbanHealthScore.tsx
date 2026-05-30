import { az } from '@/i18n/az';
import type { DashboardKpis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  data: DashboardKpis;
};

function healthLabel(score: number): string {
  if (score >= 75) return az.dashboard.healthGood;
  if (score >= 50) return az.dashboard.healthFair;
  return az.dashboard.healthPoor;
}

function healthColor(score: number): string {
  if (score >= 75) return '#52c41a';
  if (score >= 50) return '#faad14';
  return '#ff4d4f';
}

export function UrbanHealthScore({ data }: Props) {
  const score = data.healthScore;
  const color = healthColor(score);
  const circumference = Math.PI * 56;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{az.dashboard.healthScore}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="relative h-24 w-32">
          <svg viewBox="0 0 120 70" className="h-full w-full">
            <path
              d="M 12 60 A 48 48 0 0 1 108 60"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 12 60 A 48 48 0 0 1 108 60"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <span className="text-3xl font-bold tabular-nums" style={{ color }}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <p className="mt-2 text-sm font-medium" style={{ color }}>
          {healthLabel(score)}
        </p>
        <dl className="mt-4 grid w-full grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <dt className="text-muted-foreground">SLA</dt>
            <dd className="font-semibold tabular-nums">{data.slaPercent}%</dd>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <dt className="text-muted-foreground">{az.dashboard.kpiResolutionRate}</dt>
            <dd className="font-semibold tabular-nums">{data.resolutionRate}%</dd>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <dt className="text-muted-foreground">{az.dashboard.kpiActive}</dt>
            <dd className="font-semibold tabular-nums">{data.activeProblems}</dd>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <dt className="text-muted-foreground">{az.dashboard.kpiOverdue}</dt>
            <dd className="font-semibold tabular-nums text-destructive">{data.overdueTasks}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
