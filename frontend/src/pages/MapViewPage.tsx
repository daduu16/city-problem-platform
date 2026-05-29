import { lazy, Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiUnreachable } from '@/lib/apiError';
import type { MapIncident } from '@/types';
import { az } from '@/i18n/az';
import { ApiConnectionAlert } from '@/components/ApiConnectionAlert';
import { IncidentMap } from '@/components/map/IncidentMap';
import { MapLegendsPanel } from '@/components/map/MapLegendsPanel';
import { MapControlsPanel } from '@/components/map/MapControlsPanel';
import { IncidentDrawer } from '@/components/incidents/IncidentDrawer';
import { useNarimanovRayon } from '@/hooks/useNarimanovRayon';
import { useNarimanovPlaces } from '@/hooks/useNarimanovPlaces';
import { useAuthStore } from '@/stores/authStore';
import { useFilteredMapIncidents } from '@/hooks/useFilteredMapIncidents';
import { useMapStore } from '@/stores/mapStore';
import { MapDateRangePicker } from '@/components/map/MapDateRangePicker';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const IncidentMap3D = lazy(() =>
  import('@/components/map/IncidentMap3D').then((m) => ({
    default: m.IncidentMap3D,
  })),
);

export type MapPageVariant = 'active' | 'archived';

type Props = {
  variant: MapPageVariant;
};

export function MapViewPage({ variant }: Props) {
  const isArchived = variant === 'archived';
  const selectedIncidentId = useMapStore((s) => s.selectedIncidentId);
  const setSelectedIncidentId = useMapStore((s) => s.setSelectedIncidentId);
  const initLayersFromAccess = useMapStore((s) => s.initLayersFromAccess);
  const initPlaceTypes = useMapStore((s) => s.initPlaceTypes);
  const setShowPlaces = useMapStore((s) => s.setShowPlaces);
  const viewMode = useMapStore((s) => s.viewMode);
  const access = useAuthStore((s) => s.access);

  useEffect(() => {
    if (access?.mapLayers) {
      initLayersFromAccess(access.mapLayers);
    }
  }, [access?.mapLayers, initLayersFromAccess]);

  useEffect(() => {
    if (isArchived) {
      setShowPlaces(false);
    }
  }, [isArchived, setShowPlaces]);

  const incidentsQuery = useQuery({
    queryKey: ['incidents', 'map', variant],
    queryFn: async () => {
      const path = isArchived ? '/incidents/map/archived' : '/incidents/map';
      const res = await api.get<MapIncident[]>(path);
      return res.data;
    },
  });

  const narimanovQuery = useNarimanovRayon();
  const placesQuery = useNarimanovPlaces();

  const incidents = incidentsQuery.data ?? [];
  const visibleIncidents = useFilteredMapIncidents(incidents);
  const markerMode = isArchived ? 'type' : 'status';
  const narimanovRayon = narimanovQuery.data;
  const placesGeoJson = placesQuery.data;
  const isLoading =
    incidentsQuery.isLoading ||
    narimanovQuery.isLoading ||
    (!isArchived && placesQuery.isLoading);

  useEffect(() => {
    if (!placesGeoJson || isArchived) return;
    const types = [
      ...new Set(
        placesGeoJson.features.map(
          (f) => (f.properties as { placeType?: string })?.placeType ?? '',
        ),
      ),
    ].filter(Boolean);
    initPlaceTypes(types);
  }, [placesGeoJson, isArchived, initPlaceTypes]);

  const apiUnreachable = isApiUnreachable(incidentsQuery.error);

  const retryAll = () => {
    void incidentsQuery.refetch();
    void narimanovQuery.refetch();
    if (!isArchived) void placesQuery.refetch();
  };

  const mapReady = narimanovRayon && (isArchived || placesGeoJson);

  return (
    <div className="flex h-screen flex-col">
      <header className="relative z-50 shrink-0 space-y-3 border-b bg-background px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isArchived ? az.map.archivedTitle : az.map.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? az.incidents.subtitleLoading
                : isArchived
                  ? az.map.archivedSubtitle(visibleIncidents.length, viewMode)
                  : az.map.subtitle(
                      visibleIncidents.length,
                      narimanovRayon?.properties.Area,
                      viewMode,
                    )}
            </p>
          </div>
          <MapDateRangePicker />
        </div>
        {apiUnreachable && <ApiConnectionAlert onRetry={retryAll} />}
        {narimanovQuery.isError && (
          <p className="text-sm text-destructive">
            {narimanovQuery.error instanceof Error
              ? narimanovQuery.error.message
              : 'Narimanov rayon GeoJSON yüklənmədi'}
          </p>
        )}
      </header>
      <div className="relative m-4 mt-0 flex-1 overflow-hidden rounded-xl">
        <Card className="h-full overflow-hidden border-0 shadow-none">
          {isLoading || !mapReady ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : viewMode === '3d' ? (
            <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
              <IncidentMap3D
                incidents={incidents}
                markerMode={markerMode}
                narimanovRayon={narimanovRayon}
                places={placesGeoJson ?? { type: 'FeatureCollection', features: [] }}
              />
            </Suspense>
          ) : (
            <IncidentMap
              incidents={incidents}
              markerMode={markerMode}
              narimanovRayon={narimanovRayon}
              places={placesGeoJson ?? { type: 'FeatureCollection', features: [] }}
            />
          )}
        </Card>
        <MapLegendsPanel
          incidents={incidents}
          variant={variant}
          showPlacesLayer={!isArchived}
        />
        <MapControlsPanel incidents={incidents} showPlacesToggle={!isArchived} />
      </div>
      <IncidentDrawer
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
      />
    </div>
  );
}
