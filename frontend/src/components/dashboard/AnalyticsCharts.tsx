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
import { formatCategory } from '@/lib/format';
import { getStatusStyle } from '@/lib/incidentStyles';
import type { IncidentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  '#eab308',
  '#22c55e',
  '#a855f7',
  '#f97316',
  'hsl(var(--muted-foreground))',
];

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
  const categoryData = byCategory.map((c) => ({
    name: c.category ? formatCategory(c.category) : '—',
    value: c.count,
  }));
  const statusData = byStatus.map((s) => ({
    name: getStatusStyle(s.status as IncidentStatus).label,
    count: s.count,
    fill: getStatusStyle(s.status as IncidentStatus).color,
  }));

  const tooltipStyle = {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    color: 'hsl(var(--popover-foreground))',
  };

  const visibleCount = [showTimeline, showCategory, showStatus].filter(Boolean).length;
  if (visibleCount === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {showTimeline && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {az.dashboard.chartTimeline}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Say"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {showCategory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {az.dashboard.chartCategory}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {showStatus && (
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {az.dashboard.chartStatus}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
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
