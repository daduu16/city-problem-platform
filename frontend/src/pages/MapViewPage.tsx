import { lazy, Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isApiUnreachable } from "@/lib/apiError";
import type { MapIncident } from "@/types";
import { az } from "@/i18n/az";
import { ApiConnectionAlert } from "@/components/ApiConnectionAlert";
import { IncidentMap } from "@/components/map/IncidentMap";
import { MapLegendsPanel } from "@/components/map/MapLegendsPanel";
import { MapControlsPanel } from "@/components/map/MapControlsPanel";
import { IncidentDrawer } from "@/components/incidents/IncidentDrawer";
import { useNarimanovRayon } from "@/hooks/useNarimanovRayon";
import { useNarimanovPlaces } from "@/hooks/useNarimanovPlaces";
import { useAuthStore } from "@/stores/authStore";
import { useFilteredMapIncidents } from "@/hooks/useFilteredMapIncidents";
import { useMapStore } from "@/stores/mapStore";
import { collectCategoryKeysFromIncidents } from "@/lib/mapIncidentCategory";
import { MapPageHeaderActions } from "@/components/map/MapPageHeaderActions";
import { MapCreateIncidentBanner } from "@/components/map/MapCreateIncidentBanner";
import { CreateIncidentSheet } from "@/components/map/CreateIncidentSheet";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const IncidentMap3D = lazy(() =>
	import("@/components/map/IncidentMap3D").then((m) => ({
		default: m.IncidentMap3D,
	})),
);

export type MapPageVariant = "active" | "archived";

type Props = {
	variant: MapPageVariant;
};

export function MapViewPage({ variant }: Props) {
	const isArchived = variant === "archived";
	const selectedIncidentId = useMapStore((s) => s.selectedIncidentId);
	const setSelectedIncidentId = useMapStore((s) => s.setSelectedIncidentId);
	const initCategoriesFromAccess = useMapStore((s) => s.initCategoriesFromAccess);
	const syncCategoryFiltersFromIncidents = useMapStore(
		(s) => s.syncCategoryFiltersFromIncidents,
	);
	const initPlaceTypes = useMapStore((s) => s.initPlaceTypes);
	const setShowPlaces = useMapStore((s) => s.setShowPlaces);
	const cancelIncidentCreate = useMapStore((s) => s.cancelIncidentCreate);
	const viewMode = useMapStore((s) => s.viewMode);
	const baseMap = useMapStore((s) => s.baseMap);
	const access = useAuthStore((s) => s.access);
	const mapEngineLabel =
		baseMap === "google_satellite"
			? "Google Satellite"
			: baseMap === "google_road"
				? "Google Road"
				: viewMode === "3d"
					? "3D xəritə (MapLibre)"
					: "OpenStreetMap";

	useEffect(() => {
		if (access?.mapLayers) {
			initCategoriesFromAccess(access.mapLayers);
		}
	}, [access?.mapLayers, initCategoriesFromAccess]);

	useEffect(() => {
		if (isArchived) {
			setShowPlaces(false);
			cancelIncidentCreate();
		}
	}, [isArchived, setShowPlaces, cancelIncidentCreate]);

	const incidentsQuery = useQuery({
		queryKey: ["incidents", "map", variant],
		queryFn: async () => {
			const path = isArchived ? "/incidents/map/archived" : "/incidents/map";
			const res = await api.get<MapIncident[]>(path);
			return res.data;
		},
		refetchInterval: isArchived ? false : 1000,
		refetchIntervalInBackground: true,
	});

	const narimanovQuery = useNarimanovRayon();
	const placesQuery = useNarimanovPlaces();

	const incidents = incidentsQuery.data ?? [];
	const narimanovRayon = narimanovQuery.data;
	const placesGeoJson = placesQuery.data;

	useEffect(() => {
		if (!incidents.length || !access?.mapLayers) return;
		syncCategoryFiltersFromIncidents(
			collectCategoryKeysFromIncidents(incidents),
			access.mapLayers,
		);
	}, [incidents, access?.mapLayers, syncCategoryFiltersFromIncidents]);

	const visibleIncidents = useFilteredMapIncidents(
		incidents,
		narimanovRayon?.feature,
	);
	const markerMode = isArchived ? "type" : "status";
	const isLoading =
		incidentsQuery.isLoading ||
		narimanovQuery.isLoading ||
		(!isArchived && placesQuery.isLoading);

	useEffect(() => {
		if (!placesGeoJson || isArchived) return;
		const types = [
			...new Set(
				placesGeoJson.features.map(
					(f) => (f.properties as { placeType?: string })?.placeType ?? "",
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
									? az.map.archivedSubtitle(
											visibleIncidents.length,
											viewMode,
											mapEngineLabel,
										)
									: az.map.subtitle(
											visibleIncidents.length,
											narimanovRayon?.properties.Area,
											viewMode,
											mapEngineLabel,
										)}
						</p>
					</div>
					<MapPageHeaderActions showCreate={!isArchived} />
				</div>
				{apiUnreachable && <ApiConnectionAlert onRetry={retryAll} />}
				{narimanovQuery.isError && (
					<p className="text-sm text-destructive">
						{narimanovQuery.error instanceof Error
							? narimanovQuery.error.message
							: "Narimanov rayon GeoJSON yüklənmədi"}
					</p>
				)}
			</header>
			<div className="relative flex-1 overflow-hidden">
				<Card className="h-full overflow-hidden rounded-none border-0 shadow-none">
					{isLoading || !mapReady ? (
						<Skeleton className="h-full w-full rounded-none" />
					) : viewMode === "3d" ? (
						<Suspense
							fallback={<Skeleton className="h-full w-full rounded-none" />}
						>
							<IncidentMap3D
								incidents={incidents}
								markerMode={markerMode}
								narimanovRayon={narimanovRayon}
								places={
									placesGeoJson ?? { type: "FeatureCollection", features: [] }
								}
							/>
						</Suspense>
					) : (
						<IncidentMap
							incidents={incidents}
							markerMode={markerMode}
							narimanovRayon={narimanovRayon}
							places={
								placesGeoJson ?? { type: "FeatureCollection", features: [] }
							}
						/>
					)}
				</Card>
				<MapLegendsPanel
					incidents={incidents}
					variant={variant}
					showPlacesLayer={!isArchived}
				/>
				<MapControlsPanel
					incidents={incidents}
					showPlacesToggle={!isArchived}
				/>
				<MapCreateIncidentBanner />
			</div>
			<CreateIncidentSheet />
			<IncidentDrawer
				incidentId={selectedIncidentId}
				onClose={() => setSelectedIncidentId(null)}
			/>
		</div>
	);
}
