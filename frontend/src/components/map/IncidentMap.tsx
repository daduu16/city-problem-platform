import { useMemo, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { MapIncident } from "@/types";
import { useMapStore } from "@/stores/mapStore";
import { useFilteredMapIncidents } from "@/hooks/useFilteredMapIncidents";
import { statusMarkerHtml } from "@/lib/incidentStyles";
import {
	NARIMANOV_CENTER,
	BASE_MAP_ATTRIBUTION,
	BASE_MAP_TILE_URL,
	getActiveMapRegion,
} from "@/lib/mapConfig";
import type { NarimanovRayonData } from "@/lib/narimanovRayon";
import { DistrictHighlight2D } from "@/components/map/DistrictHighlight2D";
import { MapRegionLimits2D } from "@/components/map/MapRegionLimits2D";
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
	narimanovRayon: NarimanovRayonData;
}

function createStatusMarkerIcon(status: MapIncident["status"]) {
	const size = status === "OVERDUE" ? 18 : status === "PENDING" ? 16 : 14;
	return L.divIcon({
		className: "incident-marker-wrapper",
		html: statusMarkerHtml(status),
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
			maxZoom: NARIMANOV_CENTER.zoom,
		});
	}, [map, positions]);

	return null;
}

function HeatmapLayer({ points }: { points: Array<[number, number, number]> }) {
	const map = useMap();

	useEffect(() => {
		if (!points.length) return;

		let layer: L.Layer | null = null;

		void import("leaflet.heat").then(() => {
			const heatLayer = (
				L as typeof L & {
					heatLayer: (p: typeof points, o?: object) => L.Layer;
				}
			).heatLayer;
			layer = heatLayer(points, {
				radius: 28,
				blur: 18,
				maxZoom: 17,
				minOpacity: 0.35,
			});
			layer.addTo(map);
		});

		return () => {
			if (layer) map.removeLayer(layer);
		};
	}, [map, points]);

	return null;
}

export function IncidentMap({ incidents, narimanovRayon }: Props) {
	const { showHeatmap, showClusters, setSelectedIncidentId } = useMapStore();
	const filtered = useFilteredMapIncidents(incidents);
	const { positions } = narimanovRayon;

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
			icon={createStatusMarkerIcon(i.status)}
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

			{showHeatmap && <HeatmapLayer points={heatPoints} />}

			<DistrictHighlight2D rayon={narimanovRayon} />

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
