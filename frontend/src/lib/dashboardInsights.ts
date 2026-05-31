import type { DashboardKpis, IncidentStatus } from '@/types';

const STATUS_ORDER: IncidentStatus[] = [
  'OVERDUE',
  'NEW',
  'IN_PROGRESS',
  'PENDING',
  'RESOLVED',
  'ARCHIVED',
];

export type DashboardInsightTone = 'neutral' | 'warning' | 'positive';

export interface DashboardInsight {
  tone: DashboardInsightTone;
  message: string;
}

export function sumTimelineSlice(counts: number[], start: number, end: number): number {
  return counts.slice(start, end).reduce((a, b) => a + b, 0);
}

/** Week-over-week % change from a daily timeline (oldest → newest). */
export function timelineWeekChangePercent(timelineCounts: number[]): number | null {
  const n = timelineCounts.length;
  if (n < 14) return null;
  const prev = sumTimelineSlice(timelineCounts, n - 14, n - 7);
  const last = sumTimelineSlice(timelineCounts, n - 7, n);
  if (prev === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - prev) / prev) * 100);
}

export function sortStatusRows<T extends { status: string; count: number }>(rows: T[]): T[] {
  const order = new Map(STATUS_ORDER.map((s, i) => [s, i]));
  return [...rows].sort(
    (a, b) => (order.get(a.status as IncidentStatus) ?? 99) - (order.get(b.status as IncidentStatus) ?? 99),
  );
}

export function buildDashboardInsight(
  kpis: DashboardKpis,
  timelineCounts: number[],
): DashboardInsight {
  const critical = kpis.priorityOpen.CRITICAL;
  const overdue = kpis.overdueTasks;

  if (critical > 0 || overdue > 0) {
    const parts: string[] = [];
    if (critical > 0) parts.push(`${critical} kritik`);
    if (overdue > 0) parts.push(`${overdue} gecikmiş`);
    return {
      tone: 'warning',
      message: `${parts.join(' və ')} açıq hadisə — dərhal nəzarət tələb olunur.`,
    };
  }

  const trend = timelineWeekChangePercent(timelineCounts);
  if (trend != null && trend >= 15) {
    return {
      tone: 'warning',
      message: `Son 7 gündə yeni hadisələr əvvəlki həftəyə nisbətən ${trend}% artıb.`,
    };
  }
  if (trend != null && trend <= -15) {
    return {
      tone: 'positive',
      message: `Son 7 gündə yeni hadisələr əvvəlki həftəyə nisbətən ${Math.abs(trend)}% azalıb.`,
    };
  }

  if (kpis.healthScore >= 75 && kpis.slaPercent >= 80) {
    return {
      tone: 'positive',
      message: 'Əksər göstəricilər norma daxilində — şəhər sağlamlıq indeksi yüksəkdir.',
    };
  }

  return {
    tone: 'neutral',
    message: 'Hadisə axını sabitdir. Aşağıdakı status və trend panellərinə baxın.',
  };
}
