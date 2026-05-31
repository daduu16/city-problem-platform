import { useMemo } from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { az } from '@/i18n/az';
import { formatCategory, formatShortDate } from '@/lib/format';
import { buildCategoryPieRows, categoryPieTotal } from '@/lib/chartData';
import type { ResolutionTimelinePoint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART, chartTooltipProps } from '@/lib/chartTheme';
import { CategoryPieTooltip } from '@/components/dashboard/CategoryPieTooltip';
import { DistributionDrilldownChart } from '@/components/dashboard/DistributionDrilldownChart';

interface Props {
  timeline: Array<{ date: string; count: number }>;
  resolutionTimeline: ResolutionTimelinePoint[];
  byCategory: Array<{ category?: { key: string; name: string }; count: number }>;
  byStatus?: Array<{ status: string; count: number }>;
  showTimeline?: boolean;
  showResolution?: boolean;
  showCategory?: boolean;
  showDistribution?: boolean;
}

export function AnalyticsCharts({
  timeline,
  resolutionTimeline,
  byCategory,
  byStatus = [],
  showTimeline = true,
  showResolution = true,
  showCategory = true,
  showDistribution = true,
}: Props) {
  const categoryPieData = useMemo(() => {
    const items = byCategory.map((c) => ({
      name: c.category ? formatCategory(c.category) : '—',
      value: c.count,
    }));
    return buildCategoryPieRows(items);
  }, [byCategory]);

  const categoryPieTotalCount = useMemo(
    () => categoryPieTotal(categoryPieData),
    [categoryPieData],
  );

  const timelineFormatted = timeline.map((t) => ({
    ...t,
    label: formatShortDate(t.date),
  }));

  const resolutionFormatted = resolutionTimeline.map((t) => ({
    ...t,
    label: formatShortDate(t.date),
  }));

  const visibleCount = [showTimeline, showResolution, showCategory, showDistribution].filter(
    Boolean,
  ).length;
  if (visibleCount === 0) return null;

  const showDistributionCategoryRow = showDistribution || showCategory;

  return (
    <div className="dashboard-charts space-y-4">
      {(showTimeline || showResolution) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showTimeline && (
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  {az.dashboard.chartTimeline}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{az.dashboard.chartTimelineHint}</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineFormatted}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} />
                    <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip {...chartTooltipProps} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={CHART.line}
                      strokeWidth={2}
                      dot={{ fill: CHART.line, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5 }}
                      name={az.dashboard.chartCount}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showResolution && (
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  {az.dashboard.chartResolution}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {az.dashboard.chartResolutionHint}
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={resolutionFormatted}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} />
                    <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip {...chartTooltipProps} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#5d5fef"
                      strokeWidth={2}
                      dot={false}
                      name={az.dashboard.chartCreated}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={false}
                      name={az.dashboard.chartResolved}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {showDistributionCategoryRow && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showDistribution && (
            <DistributionDrilldownChart fallbackByStatus={byStatus} />
          )}
          {showCategory && categoryPieData.length > 0 && (
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  {az.dashboard.chartCategory}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{az.dashboard.chartCategoryHint}</p>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={1}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {categoryPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryPieTooltip total={categoryPieTotalCount} />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
