import { useMemo } from 'react';
import {
  Bar,
  BarChart,
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
import { getStatusStyle } from '@/lib/incidentStyles';
import { buildCategoryPieRows, categoryPieTotal } from '@/lib/chartData';
import type { IncidentStatus, ResolutionTimelinePoint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART, chartTooltipProps } from '@/lib/chartTheme';
import { CategoryPieTooltip } from '@/components/dashboard/CategoryPieTooltip';

interface Props {
  timeline: Array<{ date: string; count: number }>;
  resolutionTimeline: ResolutionTimelinePoint[];
  byCategory: Array<{ category?: { key: string; name: string }; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  showTimeline?: boolean;
  showResolution?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
}

export function AnalyticsCharts({
  timeline,
  resolutionTimeline,
  byCategory,
  byStatus,
  showTimeline = true,
  showResolution = true,
  showCategory = true,
  showStatus = true,
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

  const statusData = byStatus.map((s) => ({
    name: getStatusStyle(s.status as IncidentStatus).label,
    count: s.count,
    fill: getStatusStyle(s.status as IncidentStatus).color,
  }));

  const timelineFormatted = timeline.map((t) => ({
    ...t,
    label: formatShortDate(t.date),
  }));

  const resolutionFormatted = resolutionTimeline.map((t) => ({
    ...t,
    label: formatShortDate(t.date),
  }));

  const visibleCount = [showTimeline, showResolution, showCategory, showStatus].filter(
    Boolean,
  ).length;
  if (visibleCount === 0) return null;

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {showStatus && (
          <Card className="border-border/60 bg-card shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                {az.dashboard.chartStatus}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: CHART.axis, fontSize: 11 }} />
                  <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip {...chartTooltipProps} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name={az.dashboard.chartCount}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {showCategory && categoryPieData.length > 0 && (
          <Card className="border-border/60 bg-card shadow-sm lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                {az.dashboard.chartCategory}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={72}
                    paddingAngle={1}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {categoryPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CategoryPieTooltip total={categoryPieTotalCount} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
