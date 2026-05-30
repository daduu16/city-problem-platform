import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiUnreachable } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';
import type {
  DashboardKpis,
  RecentEventRow,
  ResolutionTimelinePoint,
  TopZoneRow,
} from '@/types';
import { az } from '@/i18n/az';
import { ApiConnectionAlert } from '@/components/ApiConnectionAlert';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { CategoryRankingList } from '@/components/dashboard/CategoryRankingList';
import { LiveEventsFeed } from '@/components/dashboard/LiveEventsFeed';
import { IncidentDrawer } from '@/components/incidents/IncidentDrawer';
import { PriorityKpiCards } from '@/components/dashboard/PriorityKpiCards';
import { TopZonesTable } from '@/components/dashboard/TopZonesTable';
import { UrbanHealthScore } from '@/components/dashboard/UrbanHealthScore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { PlusCircle, Zap } from 'lucide-react';

export function DashboardPage() {
  const hasAnalytics = useAuthStore((s) => s.hasAnalytics);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const kpisQuery = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: async () => {
      const res = await api.get<DashboardKpis>('/analytics/kpis');
      return res.data;
    },
    enabled: hasAnalytics('kpis'),
  });

  const kpis = kpisQuery.data;
  const isLoading = kpisQuery.isLoading;
  const apiUnreachable = isApiUnreachable(kpisQuery.error);

  const { data: timeline = [] } = useQuery({
    queryKey: ['analytics', 'timeline', 14],
    queryFn: async () => {
      const res = await api.get<Array<{ date: string; count: number }>>(
        '/analytics/timeline?days=14',
      );
      return res.data;
    },
    enabled: hasAnalytics('timeline'),
  });

  const { data: resolutionTimeline = [] } = useQuery({
    queryKey: ['analytics', 'resolution-timeline', 14],
    queryFn: async () => {
      const res = await api.get<ResolutionTimelinePoint[]>(
        '/analytics/resolution-timeline?days=14',
      );
      return res.data;
    },
    enabled: hasAnalytics('timeline'),
  });

  const { data: byCategory = [] } = useQuery({
    queryKey: ['analytics', 'by-category'],
    queryFn: async () => {
      const res = await api.get<
        Array<{ categoryId: string; category: { key: string; name: string }; count: number }>
      >('/analytics/by-category');
      return res.data;
    },
    enabled: hasAnalytics('by_category'),
  });

  const { data: byStatus = [] } = useQuery({
    queryKey: ['analytics', 'by-status'],
    queryFn: async () => {
      const res = await api.get<Array<{ status: string; count: number }>>(
        '/analytics/by-status',
      );
      return res.data;
    },
    enabled: hasAnalytics('by_status'),
  });

  const { data: recentEvents = [] } = useQuery({
    queryKey: ['analytics', 'recent-events'],
    queryFn: async () => {
      const res = await api.get<RecentEventRow[]>('/analytics/recent-events?limit=8');
      return res.data;
    },
    enabled: hasAnalytics('recent_events'),
  });

  const { data: topZones = [] } = useQuery({
    queryKey: ['analytics', 'top-zones'],
    queryFn: async () => {
      const res = await api.get<TopZoneRow[]>('/analytics/top-zones');
      return res.data;
    },
    enabled: hasAnalytics('top_zones'),
  });

  const timelineCounts = useMemo(() => timeline.map((t) => t.count), [timeline]);

  const showCharts =
    hasAnalytics('timeline') ||
    hasAnalytics('by_category') ||
    hasAnalytics('by_status');

  return (
    <div className="dashboard-page mx-auto max-w-[1600px] p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {az.dashboard.title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {az.dashboard.subtitle}
          </p>
        </div>
        {kpis && (
          <div className="flex flex-wrap gap-3">
            <QuickStat
              icon={Zap}
              label={az.dashboard.kpiActive}
              value={kpis.activeProblems}
              color="#5d5fef"
            />
            <QuickStat
              icon={PlusCircle}
              label={az.dashboard.kpiNewToday}
              value={kpis.newToday}
              color="#faad14"
            />
          </div>
        )}
        {apiUnreachable && (
          <ApiConnectionAlert onRetry={() => void kpisQuery.refetch()} />
        )}
      </header>

      {isLoading && !apiUnreachable ? (
        <DashboardSkeleton />
      ) : kpis ? (
        <div className="space-y-6">
          <PriorityKpiCards data={kpis} timelineCounts={timelineCounts} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              {showCharts && (
                <AnalyticsCharts
                  timeline={timeline}
                  resolutionTimeline={resolutionTimeline}
                  byCategory={byCategory}
                  byStatus={byStatus}
                  showTimeline={hasAnalytics('timeline')}
                  showResolution={hasAnalytics('timeline')}
                  showCategory={hasAnalytics('by_category')}
                  showStatus={hasAnalytics('by_status')}
                />
              )}
              {hasAnalytics('top_zones') && <TopZonesTable zones={topZones} />}
            </div>

            <div className="space-y-4">
              <UrbanHealthScore data={kpis} />
              {hasAnalytics('by_category') && (
                <CategoryRankingList items={byCategory} />
              )}
              {hasAnalytics('recent_events') && (
                <LiveEventsFeed
                  events={recentEvents}
                  onEventClick={setSelectedIncidentId}
                />
              )}
            </div>
          </div>
        </div>
      ) : !hasAnalytics('kpis') ? (
        <Card className="border-border/60 p-8 text-center text-sm text-muted-foreground">
          {az.dashboard.noData}
        </Card>
      ) : null}

      <IncidentDrawer
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
      />
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 shadow-sm">
      <Icon className="h-4 w-4" style={{ color }} />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
