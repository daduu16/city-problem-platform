import { useMemo, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { MapIncident } from "@/types";
import { useMapStore } from "@/stores/mapStore";
import { useFilteredMapIncidents } from "@/hooks/useFilteredMapIncidents";
import { statusMarkerHtml } from "@/lib/incidentStyles";
import { typeMarkerHtml } from "@/lib/incidentTypeStyles";
import type { IncidentMarkerMode } from "@/stores/mapStore";
import {
	NARIMANOV_CENTER,
	BASE_MAP_ATTRIBUTION,
	BASE_MAP_TILE_URL,
	getActiveMapRegion,
} from "@/lib/mapConfig";
import type { NarimanovRayonData } from "@/lib/narimanovRayon";
import { DistrictHighlight2D } from "@/components/map/DistrictHighlight2D";
import { MapRegionLimits2D } from "@/components/map/MapRegionLimits2D";
import { InstitutionBuildings2D } from "@/components/map/InstitutionBuildings2D";
import { PlacesLayer2D } from "@/components/map/PlacesLayer2D";
import { useInstitutionBuildingsGeoJson } from "@/hooks/useInstitutionBuildingsGeoJson";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

interface Props {
	incidents: MapIncident[];
	markerMode?: IncidentMarkerMode;
	narimanovRayon: NarimanovRayonData;
	places: GeoJSON.FeatureCollection;
}

function createIncidentMarkerIcon(
	incident: MapIncident,
	markerMode: IncidentMarkerMode,
) {
	const html =
		markerMode === "type"
			? typeMarkerHtml(incident.type)
			: statusMarkerHtml(incident.status);
	const size =
		markerMode === "type"
			? incident.type === "EMERGENCY"
				? 18
				: 14
			: incident.status === "OVERDUE"
				? 18
				: incident.status === "PENDING"
					? 16
					: 14;
	return L.divIcon({
		className: "incident-marker-wrapper",
		html,
		iconSize: [size, size],
		iconAnchor: [size / 2, size / 2],
	});
}

function FitNarimanovBounds({ positions }: { positions: [number, number][] }) {
	const map = useMap();

	useEffect(() => {
		if (positions.length < 3) return;
		map.fitBounds(L.latLngBounds(positions), {
			padding: [32, 32],
			maxZoom: Math.min(NARIMANOV_CENTER.zoom, 16),
		});
	}, [map, positions]);

	return null;
}

function HeatmapLayer({
	points,
	enabled,
}: {
	points: Array<[number, number, number]>;
	enabled: boolean;
}) {
	const map = useMap();
	const layerRef = useRef<L.Layer | null>(null);

	useEffect(() => {
		const removeHeatLayer = () => {
			if (!layerRef.current) return;
			map.removeLayer(layerRef.current);
			layerRef.current = null;
		};

		if (!enabled || !points.length) {
			removeHeatLayer();
			return;
		}

		let cancelled = false;

		void import("leaflet.heat").then(() => {
			if (cancelled) return;

			removeHeatLayer();

			const heatLayer = (
				L as typeof L & {
					heatLayer: (p: typeof points, o?: object) => L.Layer;
				}
			).heatLayer;
			const layer = heatLayer(points, {
				radius: 28,
				blur: 18,
				maxZoom: 17,
				minOpacity: 0.35,
			});
			layerRef.current = layer;
			layer.addTo(map);
		});

		return () => {
			cancelled = true;
			removeHeatLayer();
		};
	}, [map, points, enabled]);

	return null;
}

export function IncidentMap({
	incidents,
	markerMode = "status",
	narimanovRayon,
	places,
}: Props) {
	const {
		showHeatmap,
		showClusters,
		showPlaces,
		visiblePlaceTypes,
		setSelectedIncidentId,
	} = useMapStore();
	const filtered = useFilteredMapIncidents(incidents);
	const { positions } = narimanovRayon;

	const institutionQuery = useInstitutionBuildingsGeoJson(
		showPlaces ? places : undefined,
		positions,
	);

	const institutionBuildings = showPlaces
		? institutionQuery.data
		: undefined;
	const matchedBuildingCount = institutionBuildings?.features.length ?? 0;
	const usePlacePointsFallback =
		showPlaces && !institutionQuery.isLoading && matchedBuildingCount === 0;

	const mapRegion = getActiveMapRegion();

	const heatPoints = useMemo(
		() =>
			filtered.map((i) => {
				const w =
					i.priority === "CRITICAL" ? 1 : i.priority === "HIGH" ? 0.7 : 0.4;
				return [i.lat, i.lng, w] as [number, number, number];
			}),
		[filtered],
	);

	const handleMarkerClick = useCallback(
		(id: string) => {
			setSelectedIncidentId(id);
		},
		[setSelectedIncidentId],
	);

	const renderMarker = (i: MapIncident) => (
		<Marker
			key={i.id}
			position={[i.lat, i.lng]}
			icon={createIncidentMarkerIcon(i, markerMode)}
			eventHandlers={{
				click: (e) => {
					L.DomEvent.stopPropagation(e);
					handleMarkerClick(i.id);
				},
			}}
		/>
	);

	return (
		<MapContainer
			center={[NARIMANOV_CENTER.lat, NARIMANOV_CENTER.lng]}
			zoom={NARIMANOV_CENTER.zoom}
			className="h-full w-full z-0"
			scrollWheelZoom
			minZoom={mapRegion.minZoom}
			maxZoom={mapRegion.maxZoom}
			maxBoundsViscosity={1}
		>
			<TileLayer
				url={BASE_MAP_TILE_URL}
				attribution={BASE_MAP_ATTRIBUTION}
				subdomains="abcd"
				maxZoom={20}
			/>

			<ZoomControl position="bottomleft" />

			<FitNarimanovBounds positions={positions} />
			<MapRegionLimits2D />

			<HeatmapLayer points={heatPoints} enabled={showHeatmap} />

			<DistrictHighlight2D rayon={narimanovRayon} />

			{showPlaces && matchedBuildingCount > 0 && institutionBuildings && (
				<InstitutionBuildings2D
					data={institutionBuildings}
					visible
					visibleTypes={visiblePlaceTypes}
				/>
			)}
			{usePlacePointsFallback && (
				<PlacesLayer2D
					data={places}
					visible
					visibleTypes={visiblePlaceTypes}
				/>
			)}

			{showClusters ? (
				<MarkerClusterGroup
					chunkedLoading
					maxClusterRadius={50}
					spiderfyOnMaxZoom
					showCoverageOnHover={false}
					zoomToBoundsOnClick
				>
					{filtered.map((i) => renderMarker(i))}
				</MarkerClusterGroup>
			) : (
				filtered.map((i) => renderMarker(i))
			)}
		</MapContainer>
	);
}
