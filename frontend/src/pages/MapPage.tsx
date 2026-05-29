import { lazy, Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isApiUnreachable } from "@/lib/apiError";
import type { MapIncident } from "@/types";
import { az } from "@/i18n/az";
import { ApiConnectionAlert } from "@/components/ApiConnectionAlert";
import { IncidentMap } from "@/components/map/IncidentMap";
const IncidentMap3D = lazy(() =>
	import("@/components/map/IncidentMap3D").then((m) => ({
		default: m.IncidentMap3D,
	})),
);
import { MapLegendsPanel } from "@/components/map/MapLegendsPanel";
import { MapControlsPanel } from "@/components/map/MapControlsPanel";
import { IncidentDrawer } from "@/components/incidents/IncidentDrawer";
import { useNarimanovRayon } from "@/hooks/useNarimanovRayon";
import { useAuthStore } from "@/stores/authStore";
import { useMapStore } from "@/stores/mapStore";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MapPage() {
	const selectedIncidentId = useMapStore((s) => s.selectedIncidentId);
	const setSelectedIncidentId = useMapStore((s) => s.setSelectedIncidentId);
	const initLayersFromAccess = useMapStore((s) => s.initLayersFromAccess);
	const viewMode = useMapStore((s) => s.viewMode);
	const access = useAuthStore((s) => s.access);

	useEffect(() => {
		if (access?.mapLayers) {
			initLayersFromAccess(access.mapLayers);
		}
	}, [access?.mapLayers, initLayersFromAccess]);

	const incidentsQuery = useQuery({
		queryKey: ["incidents", "map"],
		queryFn: async () => {
			const res = await api.get<MapIncident[]>("/incidents/map");
			return res.data;
		},
	});

	const narimanovQuery = useNarimanovRayon();

	const incidents = incidentsQuery.data ?? [];
	const narimanovRayon = narimanovQuery.data;
	const isLoading = incidentsQuery.isLoading || narimanovQuery.isLoading;
	const apiUnreachable = isApiUnreachable(incidentsQuery.error);

	const retryAll = () => {
		void incidentsQuery.refetch();
		void narimanovQuery.refetch();
	};

	return (
		<div className="flex h-screen flex-col">
			<header className="shrink-0 space-y-3 border-b px-6 py-4">
				<div>
					<h2 className="text-2xl font-semibold tracking-tight">
						{az.map.title}
					</h2>
					<p className="text-sm text-muted-foreground">
						{isLoading
							? az.incidents.subtitleLoading
							: az.map.subtitle(
									incidents.length,
									narimanovRayon?.properties.Area,
									viewMode,
								)}
					</p>
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
			<div className="relative m-4 mt-0 flex-1 overflow-hidden rounded-xl">
				<Card className="h-full overflow-hidden border-0 shadow-none">
					{isLoading || !narimanovRayon ? (
						<Skeleton className="h-full w-full rounded-xl" />
					) : (
						viewMode === "3d" ? (
							<Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
								<IncidentMap3D
									incidents={incidents}
									narimanovRayon={narimanovRayon}
								/>
							</Suspense>
						) : (
							<IncidentMap
								incidents={incidents}
								narimanovRayon={narimanovRayon}
							/>
						)
					)}
				</Card>
				<MapLegendsPanel />
				<MapControlsPanel />
			</div>
			<IncidentDrawer
				incidentId={selectedIncidentId}
				onClose={() => setSelectedIncidentId(null)}
			/>
		</div>
	);
}
