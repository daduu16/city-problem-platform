import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { az } from '@/i18n/az';
import { buildCategoryPieRows } from '@/lib/chartData';
import { CHART, chartTooltipProps } from '@/lib/chartTheme';
import { formatCategory } from '@/lib/format';
import { getStatusStyle } from '@/lib/incidentStyles';
import { sortStatusRows } from '@/lib/dashboardInsights';
import type { IncidentStatus, StatusCategoryBreakdown } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type StatusRow = { status: string; count: number };

type BarRow = {
  key: string;
  name: string;
  count: number;
  fill: string;
  status?: IncidentStatus;
};

type Props = {
  fallbackByStatus?: StatusRow[];
  className?: string;
};

export function DistributionDrilldownChart({ fallbackByStatus = [], className }: Props) {
  const hasAnalytics = useAuthStore((s) => s.hasAnalytics);
  const canDrilldown = hasAnalytics('by_status') && hasAnalytics('by_category');
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | null>(null);

  const breakdownQuery = useQuery({
    queryKey: ['analytics', 'status-category-breakdown'],
    queryFn: async () => {
      const res = await api.get<StatusCategoryBreakdown>('/analytics/status-category-breakdown');
      return res.data;
    },
    enabled: canDrilldown,
  });

  const statusRows = useMemo(() => {
    if (breakdownQuery.data) {
      return sortStatusRows(
        breakdownQuery.data.statuses.map((s) => ({ status: s.status, count: s.count })),
      );
    }
    return sortStatusRows(fallbackByStatus);
  }, [breakdownQuery.data, fallbackByStatus]);

  const total = statusRows.reduce((sum, r) => sum + r.count, 0);

  const statusBarData = useMemo<BarRow[]>(
    () =>
      statusRows
        .filter((r) => r.count > 0)
        .map((r) => {
          const style = getStatusStyle(r.status as IncidentStatus);
          return {
            key: r.status,
            status: r.status as IncidentStatus,
            name: style.label,
            count: r.count,
            fill: style.color,
          };
        }),
    [statusRows],
  );

  const categoryBarData = useMemo<BarRow[]>(() => {
    if (!selectedStatus || !breakdownQuery.data) return [];
    const rows = breakdownQuery.data.categoriesByStatus[selectedStatus] ?? [];
    const pieRows = buildCategoryPieRows(
      rows.map((r) => ({ name: formatCategory(r.category), value: r.count })),
    );
    return pieRows.map((r) => ({
      key: r.name,
      name: r.name,
      count: r.value,
      fill: r.fill,
    }));
  }, [selectedStatus, breakdownQuery.data]);

  const selectedStyle = selectedStatus ? getStatusStyle(selectedStatus) : null;
  const isCategoryView = selectedStatus != null && canDrilldown;
  const chartData = isCategoryView ? categoryBarData : statusBarData;
  const chartHeight = isCategoryView
    ? Math.max(240, Math.min(420, categoryBarData.length * 36 + 48))
    : 260;

  const handleStatusSelect = (status: IncidentStatus) => {
    if (!canDrilldown) return;
    setSelectedStatus(status);
  };

  const handleBarClick = (row: BarRow) => {
    if (!isCategoryView && row.status) {
      handleStatusSelect(row.status);
    }
  };

  if (breakdownQuery.isLoading && canDrilldown) {
    return <Skeleton className={cn('h-[300px] w-full rounded-xl', className)} />;
  }

  if (total === 0) {
    return (
      <Card className={cn('border-border/60 bg-card shadow-sm', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight">
            {az.dashboard.distributionChartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">{az.dashboard.noData}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('dashboard-charts border-border/60 bg-card shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            {isCategoryView && selectedStyle
              ? az.dashboard.distributionByCategory(selectedStyle.label)
              : az.dashboard.distributionChartTitle}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {isCategoryView
              ? az.dashboard.chartCategoryHint
              : canDrilldown
                ? az.dashboard.distributionChartHint
                : az.dashboard.distributionClickHint}
          </p>
        </div>
        {isCategoryView && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 px-2 text-xs"
            onClick={() => setSelectedStatus(null)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {az.dashboard.distributionBackToStatus}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        {isCategoryView && categoryBarData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {az.dashboard.distributionNoCategories}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout={isCategoryView ? 'vertical' : 'horizontal'}
              margin={
                isCategoryView
                  ? { top: 4, right: 16, left: 4, bottom: 4 }
                  : { top: 8, right: 8, left: 0, bottom: 4 }
              }
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
              {isCategoryView ? (
                <>
                  <XAxis type="number" tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={108}
                    tick={{ fill: CHART.axis, fontSize: 10 }}
                    interval={0}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART.axis, fontSize: 10 }}
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    height={72}
                  />
                  <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} />
                </>
              )}
              <Tooltip
                {...chartTooltipProps}
                formatter={(value: number) => [value, az.dashboard.chartCount]}
              />
              <Bar
                dataKey="count"
                radius={isCategoryView ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                maxBarSize={isCategoryView ? 22 : 48}
                style={{ cursor: !isCategoryView && canDrilldown ? 'pointer' : 'default' }}
                onClick={(bar) => {
                  const row = bar?.payload as BarRow | undefined;
                  if (row?.status) handleBarClick(row);
                }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.fill}
                    opacity={
                      !isCategoryView && selectedStatus && selectedStatus !== entry.status
                        ? 0.45
                        : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {!isCategoryView && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {az.dashboard.distributionTotal}: <strong className="text-foreground">{total}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
