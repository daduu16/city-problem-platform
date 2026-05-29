import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiUnreachable } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';
import type { MapIncident } from '@/types';
import { az } from '@/i18n/az';
import { ApiConnectionAlert } from '@/components/ApiConnectionAlert';
import { IncidentGrid } from '@/components/incidents/IncidentGrid';
import { IncidentDrawer } from '@/components/incidents/IncidentDrawer';
import { IncidentForm } from '@/components/incidents/IncidentForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function IncidentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const can = useAuthStore((s) => s.can);

  const listQuery = useQuery({
    queryKey: ['incidents', 'list'],
    queryFn: async () => {
      const res = await api.get<{ items: MapIncident[]; total: number }>(
        '/incidents?limit=200',
      );
      return res.data;
    },
  });

  const data = listQuery.data;
  const isLoading = listQuery.isLoading;
  const apiUnreachable = isApiUnreachable(listQuery.error);

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <header className="mb-6 space-y-3 border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{az.incidents.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? az.incidents.subtitleLoading
                : az.incidents.subtitleTotal(data?.total ?? 0)}
            </p>
          </div>
          {can('create_incident') && (
            <Button onClick={() => setFormOpen(true)}>+ New</Button>
          )}
        </div>
        {apiUnreachable && (
          <ApiConnectionAlert onRetry={() => void listQuery.refetch()} />
        )}
      </header>
      {isLoading && !apiUnreachable ? (
        <Skeleton className="h-[calc(100vh-12rem)] w-full" />
      ) : (
        data && <IncidentGrid rows={data.items} onRowClick={setSelectedId} />
      )}
      <IncidentDrawer incidentId={selectedId} onClose={() => setSelectedId(null)} />
      <IncidentForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
