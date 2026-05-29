import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { formatCategory } from '@/lib/format';
import { getStatusStyle } from '@/lib/incidentStyles';
import { buildCategoryPieRows, categoryPieTotal } from '@/lib/chartData';
import type { IncidentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART, chartTooltipProps } from '@/lib/chartTheme';
import { CategoryPieTooltip } from '@/components/dashboard/CategoryPieTooltip';

interface Props {
  timeline: Array<{ date: string; count: number }>;
  byCategory: Array<{ category?: { key: string; name: string }; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  showTimeline?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
}

export function AnalyticsCharts({
  timeline,
  byCategory,
  byStatus,
  showTimeline = true,
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

  const visibleCount = [showTimeline, showCategory, showStatus].filter(Boolean).length;
  if (visibleCount === 0) return null;

  return (
    <div className="dashboard-charts mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {showTimeline && (
        <Card className="border-border/70 bg-card/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              {az.dashboard.chartTimeline}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeline}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: CHART.axis, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} />
                <Tooltip {...chartTooltipProps} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART.line}
                  strokeWidth={2}
                  dot={{ fill: CHART.line, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: CHART.line }}
                  name="Say"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {showCategory && (
        <Card className="border-border/70 bg-card/80 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              {az.dashboard.chartCategory}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {categoryPieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">—</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
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
                  <Tooltip
                    content={
                      <CategoryPieTooltip total={categoryPieTotalCount} />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {showStatus && (
        <Card className="border-border/70 bg-card/80 lg:col-span-3">
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
                <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} />
                <Tooltip {...chartTooltipProps} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Say">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
