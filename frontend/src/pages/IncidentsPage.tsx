import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiUnreachable } from '@/lib/apiError';
import type { MapIncident } from '@/types';
import { az } from '@/i18n/az';
import {
  EMPTY_INCIDENT_GRID_FILTERS,
  hasActiveIncidentGridFilters,
  useFilteredIncidents,
} from '@/lib/incidentGridFilters';
import { ApiConnectionAlert } from '@/components/ApiConnectionAlert';
import { IncidentGrid } from '@/components/incidents/IncidentGrid';
import { IncidentGridFilters } from '@/components/incidents/IncidentGridFilters';
import { IncidentDrawer } from '@/components/incidents/IncidentDrawer';
import { Skeleton } from '@/components/ui/skeleton';

export function IncidentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_INCIDENT_GRID_FILTERS);

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
  const rows = data?.items ?? [];
  const filteredRows = useFilteredIncidents(rows, filters);
  const isLoading = listQuery.isLoading;
  const apiUnreachable = isApiUnreachable(listQuery.error);

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <header className="mb-6 space-y-3 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {az.incidents.title}
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            {isLoading
              ? az.incidents.subtitleLoading
              : az.incidents.subtitleTotal(data?.total ?? 0)}
          </p>
        </div>
        {apiUnreachable && (
          <ApiConnectionAlert onRetry={() => void listQuery.refetch()} />
        )}
      </header>

      {isLoading && !apiUnreachable ? (
        <Skeleton className="h-[calc(100vh-12rem)] w-full rounded-xl" />
      ) : data ? (
        <IncidentGrid
          rows={filteredRows}
          onRowClick={setSelectedId}
          toolbar={
            <IncidentGridFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(EMPTY_INCIDENT_GRID_FILTERS)}
              shownCount={filteredRows.length}
              totalCount={rows.length}
              hasActiveFilters={hasActiveIncidentGridFilters(filters)}
            />
          }
        />
      ) : null}

      <IncidentDrawer incidentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
