import { useMemo, useCallback, useEffect, useRef, type CSSProperties } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { MapIncident } from "@/types";
import { useMapStore } from "@/stores/mapStore";
import { useFilteredMapIncidents } from "@/hooks/useFilteredMapIncidents";
import { useMapIncidentPins } from "@/hooks/useMapIncidentPins";
import type { MapIncidentPin } from "@/lib/mapIncidentPin";
import { incidentMarkerHtml } from "@/lib/incidentMarkerHtml";
import {
	NARIMANOV_CENTER,
	BASE_MAP_2D_TILE_CLASS,
	getActiveMapRegion,
	getLeafletBasemapConfig,
} from "@/lib/mapConfig";
import { MAP_DISTRICT_COLOR } from "@/lib/mapPalette";
import {
	MAP_CLUSTER_DISABLE_ZOOM,
	MAP_CLUSTER_RADIUS,
} from "@/lib/mapClusterConfig";
import type { NarimanovRayonData } from "@/lib/narimanovRayon";
import { CreateIncidentDraftMarker2D } from "@/components/map/CreateIncidentDraftMarker2D";
import { MapLocationPickHandler2D } from "@/components/map/MapLocationPickHandler2D";
import { DistrictHighlight2D } from "@/components/map/DistrictHighlight2D";
import { DistrictZones2D } from "@/components/map/DistrictZones2D";
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
	narimanovRayon: NarimanovRayonData;
	places: GeoJSON.FeatureCollection;
}

function createPinMarkerIcon(pin: MapIncidentPin) {
	const { html: inner, size } = incidentMarkerHtml(pin);
	return L.divIcon({
		className: "incident-marker-wrapper",
		html: inner,
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
	narimanovRayon,
	places,
}: Props) {
	const {
		showHeatmap,
		showClusters,
		showPlaces,
		baseMap,
		visiblePlaceTypes,
		openIncident,
		incidentCreateMode,
	} = useMapStore();
	const filtered = useFilteredMapIncidents(incidents, narimanovRayon.feature);
	const pins = useMapIncidentPins(filtered);
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
	const baseMapConfig = getLeafletBasemapConfig(baseMap);

	const heatPoints = useMemo(
		() =>
			pins.map((pin) => {
				const i = pin.incident;
				const w =
					i.priority === "CRITICAL" ? 1 : i.priority === "HIGH" ? 0.7 : 0.4;
				return [pin.lat, pin.lng, w] as [number, number, number];
			}),
		[pins],
	);

	const handlePinClick = useCallback(
		(pin: MapIncidentPin) => {
			if (incidentCreateMode !== false) return;
			openIncident(pin.incident.id);
		},
		[openIncident, incidentCreateMode],
	);

	const renderPinMarker = (pin: MapIncidentPin) => (
		<Marker
			key={pin.incident.id}
			position={[pin.lat, pin.lng]}
			icon={createPinMarkerIcon(pin)}
			eventHandlers={{
				click: (e) => {
					L.DomEvent.stopPropagation(e);
					handlePinClick(pin);
				},
			}}
		/>
	);

	return (
		<MapContainer
			center={[NARIMANOV_CENTER.lat, NARIMANOV_CENTER.lng]}
			zoom={NARIMANOV_CENTER.zoom}
			className="incident-map-2d h-full w-full z-0"
			style={
				{ "--map-district-color": MAP_DISTRICT_COLOR } as CSSProperties
			}
			scrollWheelZoom
			zoomControl={false}
			minZoom={mapRegion.minZoom}
			maxZoom={mapRegion.maxZoom}
			maxBoundsViscosity={1}
		>
			<TileLayer
				url={baseMapConfig.url}
				attribution={baseMapConfig.attribution}
				className={BASE_MAP_2D_TILE_CLASS || undefined}
				subdomains={baseMapConfig.subdomains}
				maxZoom={20}
			/>

			<ZoomControl position="bottomleft" />

			<FitNarimanovBounds positions={positions} />
			<MapRegionLimits2D />
			<MapLocationPickHandler2D />
			<CreateIncidentDraftMarker2D />

			<HeatmapLayer points={heatPoints} enabled={showHeatmap} />

			<DistrictZones2D rayon={narimanovRayon} />
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
					maxClusterRadius={MAP_CLUSTER_RADIUS}
					disableClusteringAtZoom={MAP_CLUSTER_DISABLE_ZOOM}
					spiderfyOnMaxZoom
					showCoverageOnHover={false}
					zoomToBoundsOnClick
				>
					{pins.map((pin) => renderPinMarker(pin))}
				</MarkerClusterGroup>
			) : (
				pins.map((pin) => renderPinMarker(pin))
			)}
		</MapContainer>
	);
}
