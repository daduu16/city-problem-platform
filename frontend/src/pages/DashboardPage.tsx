import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiUnreachable } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';
import type { DashboardKpis } from '@/types';
import { az } from '@/i18n/az';
import { ApiConnectionAlert } from '@/components/ApiConnectionAlert';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPage() {
  const hasAnalytics = useAuthStore((s) => s.hasAnalytics);

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
    queryKey: ['analytics', 'timeline'],
    queryFn: async () => {
      const res = await api.get<Array<{ date: string; count: number }>>(
        '/analytics/timeline?days=14',
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

  return (
    <div className="dashboard-page mx-auto max-w-[1600px] p-6">
      <header className="mb-6 space-y-3 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {az.dashboard.title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {az.dashboard.subtitle}
          </p>
        </div>
        {apiUnreachable && (
          <ApiConnectionAlert onRetry={() => void kpisQuery.refetch()} />
        )}
      </header>

      {isLoading && !apiUnreachable ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : kpis ? (
        <>
          <KpiCards data={kpis} />
          <AnalyticsCharts
            timeline={timeline}
            byCategory={byCategory}
            byStatus={byStatus}
            showTimeline={hasAnalytics('timeline')}
            showCategory={hasAnalytics('by_category')}
            showStatus={hasAnalytics('by_status')}
          />
        </>
      ) : null}
    </div>
  );
}
