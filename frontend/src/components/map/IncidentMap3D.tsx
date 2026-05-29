import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import Map, {
  Source,
  Layer,
  NavigationControl,
  Popup,
  useMap,
} from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import type {
  ExpressionSpecification,
  GeoJSONSource,
  LngLatBoundsLike,
  Map as MaplibreMap,
  MapMouseEvent,
} from 'maplibre-gl';
import type { MapIncident } from '@/types';
import { useMapStore, type IncidentMarkerMode } from '@/stores/mapStore';
import { useFilteredMapIncidents } from '@/hooks/useFilteredMapIncidents';
import {
  NARIMANOV_CENTER,
  MAPLIBRE_STYLE_URL,
  MAP_3D_VIEW,
  getActiveMapRegion,
  getActiveMapRegionBoundsLngLat,
} from '@/lib/mapConfig';
import type { NarimanovRayonData } from '@/lib/narimanovRayon';
import { priorityWeightExpression } from '@/lib/mapLayerExpressions';
import { MAP_CLUSTER_COLORS } from '@/lib/mapPalette';
import { az } from '@/i18n/az';
import { Button } from '@/components/ui/button';
import { Box, Layers } from 'lucide-react';
import { Map3DStyleEnhancer } from '@/components/map/Map3DStyleEnhancer';
import { IncidentMarkers3D } from '@/components/map/IncidentMarkers3D';
import { DistrictHighlight3D } from '@/components/map/DistrictHighlight3D';
import { MapRegionLimits3D } from '@/components/map/MapRegionLimits3D';
import { TypedBuildings3D } from '@/components/map/TypedBuildings3D';
import {
  InstitutionBuildings3D,
  INSTITUTION_BUILDINGS_LAYER_ID,
} from '@/components/map/InstitutionBuildings3D';
import { PlacesLayer3D, PLACES_LAYER_ID } from '@/components/map/PlacesLayer3D';
import { useOsmBuildingsGeoJson } from '@/hooks/useOsmBuildingsGeoJson';
import { useInstitutionBuildingsGeoJson } from '@/hooks/useInstitutionBuildingsGeoJson';
import { getPlaceTypeLabel } from '@/lib/placeTypeStyles';
import 'maplibre-gl/dist/maplibre-gl.css';

const INCIDENTS_SOURCE = 'incidents';

interface Props {
  incidents: MapIncident[];
  markerMode?: IncidentMarkerMode;
  narimanovRayon: NarimanovRayonData;
  places: GeoJSON.FeatureCollection;
}

interface PlacePopupState {
  lng: number;
  lat: number;
  name: string;
  typeLabel: string;
}

function boundsFromLatLngPositions(
  positions: [number, number][],
): LngLatBoundsLike {
  const lngs = positions.map(([, lng]) => lng);
  const lats = positions.map(([lat]) => lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function FitDistrictAndTilt({ bounds }: { bounds: LngLatBoundsLike }) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    map.fitBounds(bounds, {
      padding: 48,
      maxZoom: Math.max(NARIMANOV_CENTER.zoom, MAP_3D_VIEW.minZoomForBuildings),
      duration: 0,
    });
    map.setPitch(MAP_3D_VIEW.pitch);
    map.setBearing(MAP_3D_VIEW.bearing);
  }, [mapRef, bounds]);

  return null;
}

function DisableBaseMapHoverPopups() {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const canvas = map.getCanvas();
    canvas.setAttribute('title', '');

    const onMouseMove = (e: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point);
      const hitOurs = features.some(
        (f) =>
          f.layer.id.startsWith('incident-') ||
          f.layer.id === INSTITUTION_BUILDINGS_LAYER_ID ||
          f.layer.id === PLACES_LAYER_ID,
      );
      canvas.style.cursor = hitOurs ? 'pointer' : 'grab';
    };

    map.on('mousemove', onMouseMove);
    return () => {
      map.off('mousemove', onMouseMove);
    };
  }, [mapRef]);

  return null;
}

export function IncidentMap3D({
  incidents,
  markerMode = 'status',
  narimanovRayon,
  places,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const {
    showHeatmap,
    showClusters,
    showPlaces,
    visiblePlaceTypes,
    setSelectedIncidentId,
  } = useMapStore();
  const filtered = useFilteredMapIncidents(incidents);
  const [isFlatView, setIsFlatView] = useState(false);
  const [placePopup, setPlacePopup] = useState<PlacePopupState | null>(null);

  const districtBounds = useMemo(
    () => boundsFromLatLngPositions(narimanovRayon.positions),
    [narimanovRayon.positions],
  );

  const osmBuildingsQuery = useOsmBuildingsGeoJson(narimanovRayon.positions);
  const institutionQuery = useInstitutionBuildingsGeoJson(
    showPlaces ? places : undefined,
    narimanovRayon.positions,
  );

  const institutionBuildings = showPlaces ? institutionQuery.data : undefined;

  const typedBuildings = osmBuildingsQuery.data;
  const matchedBuildingCount = institutionBuildings?.features.length ?? 0;
  const hasInstitutionBuildings = showPlaces && matchedBuildingCount > 0;
  const usePlacePointsFallback =
    showPlaces && !institutionQuery.isLoading && matchedBuildingCount === 0;
  const hasTypedBuildings =
    !showPlaces && (typedBuildings?.features.length ?? 0) > 0;

  const regionBounds = useMemo(() => getActiveMapRegionBoundsLngLat(), []);
  const mapRegion = getActiveMapRegion();

  const incidentsGeoJson = useMemo((): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: filtered.map((i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
        properties: {
          id: i.id,
          status: i.status,
          priority: i.priority,
        },
      })),
    };
  }, [filtered]);

  const clusterRadius: ExpressionSpecification = [
    'step',
    ['get', 'point_count'],
    22,
    10,
    26,
    30,
    32,
  ];

  const clusterColor: ExpressionSpecification = [
    'step',
    ['get', 'point_count'],
    MAP_CLUSTER_COLORS.small,
    10,
    MAP_CLUSTER_COLORS.medium,
    30,
    MAP_CLUSTER_COLORS.large,
  ];

  const openIncidentDrawer = useCallback(
    (id: string) => {
      setSelectedIncidentId(id);
    },
    [setSelectedIncidentId],
  );

  const handleClusterClick = useCallback(
    async (map: MaplibreMap, clusterId: number, coordinates: [number, number]) => {
      const source = map.getSource(INCIDENTS_SOURCE) as GeoJSONSource | undefined;
      if (!source) return;

      const leaves = await source.getClusterLeaves(clusterId, 50, 0);
      if (leaves.length === 1 && leaves[0].properties?.id) {
        openIncidentDrawer(String(leaves[0].properties.id));
        return;
      }

      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: coordinates, zoom, duration: 400 });
    },
    [openIncidentDrawer],
  );

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      if (showPlaces) {
        const placeLayers = [
          ...(hasInstitutionBuildings ? [INSTITUTION_BUILDINGS_LAYER_ID] : []),
          ...(usePlacePointsFallback ? [PLACES_LAYER_ID] : []),
        ];
        if (placeLayers.length > 0) {
          const placeHits = map.queryRenderedFeatures(e.point, {
            layers: placeLayers,
          });
          if (placeHits.length > 0) {
            const props = placeHits[0].properties as {
              placeName?: string;
              placeType?: string;
              NAME?: string;
              NAME_AZ?: string;
              TYPE?: string;
            };
            const placeType = props.placeType ?? props.TYPE;
            if (placeType) {
              const name =
                props.placeName ||
                (props.NAME_AZ && props.NAME_AZ.trim()) ||
                props.NAME ||
                getPlaceTypeLabel(placeType);
              setPlacePopup({
                lng: e.lngLat.lng,
                lat: e.lngLat.lat,
                name,
                typeLabel: getPlaceTypeLabel(placeType),
              });
              return;
            }
          }
        }
      }

      setPlacePopup(null);

      const layers = showClusters
        ? ['incident-clusters', 'incident-cluster-count']
        : [];

      const features =
        e.features ??
        (layers.length
          ? map.queryRenderedFeatures(e.point, { layers })
          : []);

      if (!features.length) return;

      for (const f of features) {
        const layerId = f.layer?.id;
        const clusterId = f.properties?.cluster_id as number | undefined;

        if (
          clusterId != null &&
          (layerId === 'incident-clusters' || layerId === 'incident-cluster-count')
        ) {
          const coords = (f.geometry as GeoJSON.Point).coordinates as [
            number,
            number,
          ];
          void handleClusterClick(map, clusterId, coords);
          return;
        }
      }
    },
    [
      showClusters,
      handleClusterClick,
      showPlaces,
      hasInstitutionBuildings,
      usePlacePointsFallback,
    ],
  );

  const toggleTilt = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (isFlatView) {
      map.easeTo({
        pitch: MAP_3D_VIEW.pitch,
        bearing: MAP_3D_VIEW.bearing,
        duration: 600,
      });
      setIsFlatView(false);
    } else {
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
      setIsFlatView(true);
    }
  }, [isFlatView]);

  const interactiveLayerIds = [
    ...(showPlaces && hasInstitutionBuildings
      ? [INSTITUTION_BUILDINGS_LAYER_ID]
      : []),
    ...(usePlacePointsFallback ? [PLACES_LAYER_ID] : []),
    ...(showClusters ? ['incident-clusters', 'incident-cluster-count'] : []),
  ];

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapStyle={MAPLIBRE_STYLE_URL}
        initialViewState={{
          longitude: NARIMANOV_CENTER.lng,
          latitude: NARIMANOV_CENTER.lat,
          zoom: NARIMANOV_CENTER.zoom,
          pitch: MAP_3D_VIEW.pitch,
          bearing: MAP_3D_VIEW.bearing,
        }}
        minPitch={MAP_3D_VIEW.minPitch}
        maxPitch={MAP_3D_VIEW.maxPitch}
        minZoom={mapRegion.minZoom}
        maxZoom={mapRegion.maxZoom}
        maxBounds={regionBounds}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={interactiveLayerIds}
        onClick={onMapClick}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-left" visualizePitch showCompass />
        <FitDistrictAndTilt bounds={districtBounds} />
        <MapRegionLimits3D />
        <DisableBaseMapHoverPopups />

        <Source
          id={INCIDENTS_SOURCE}
          type="geojson"
          data={incidentsGeoJson}
          cluster={showClusters}
          clusterMaxZoom={16}
          clusterRadius={50}
        >
          {showHeatmap && (
            <Layer
              id="incident-heatmap"
              type="heatmap"
              maxzoom={17}
              paint={{
                'heatmap-weight': priorityWeightExpression,
                'heatmap-intensity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  12,
                  0.6,
                  16,
                  1.4,
                ],
                'heatmap-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  12,
                  18,
                  16,
                  32,
                ],
                'heatmap-opacity': 0.75,
              }}
            />
          )}

          {showClusters && (
            <>
              <Layer
                id="incident-clusters"
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': clusterColor,
                  'circle-radius': clusterRadius,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#fff',
                  'circle-opacity': 0.95,
                }}
              />
              <Layer
                id="incident-cluster-count"
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': ['get', 'point_count_abbreviated'],
                  'text-size': 13,
                  'text-allow-overlap': true,
                }}
                paint={{ 'text-color': '#ffffff' }}
              />
            </>
          )}
        </Source>

        <DistrictHighlight3D rayon={narimanovRayon} />

        {showPlaces ? (
          <>
            {hasInstitutionBuildings && (
              <InstitutionBuildings3D
                data={institutionBuildings}
                visibleTypes={visiblePlaceTypes}
              />
            )}
            {usePlacePointsFallback && (
              <PlacesLayer3D
                data={places}
                visible
                visibleTypes={visiblePlaceTypes}
              />
            )}
          </>
        ) : (
          <TypedBuildings3D data={typedBuildings} />
        )}

        <IncidentMarkers3D
          incidents={filtered}
          markerMode={markerMode}
          showClusters={showClusters}
          onIncidentClick={openIncidentDrawer}
        />

        <Map3DStyleEnhancer
          hideBaseBuildings={hasInstitutionBuildings || hasTypedBuildings}
        />

        {placePopup && (
          <Popup
            longitude={placePopup.lng}
            latitude={placePopup.lat}
            anchor="bottom"
            onClose={() => setPlacePopup(null)}
            closeButton
            closeOnClick={false}
          >
            <div className="text-sm">
              <p className="font-semibold">{placePopup.name}</p>
              <p className="text-xs text-muted-foreground">{placePopup.typeLabel}</p>
            </div>
          </Popup>
        )}
      </Map>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute bottom-4 right-4 z-10 gap-1.5 shadow-md"
        onClick={toggleTilt}
      >
        {isFlatView ? (
          <>
            <Box className="h-4 w-4" />
            {az.map.tilt3d}
          </>
        ) : (
          <>
            <Layers className="h-4 w-4" />
            {az.map.tiltFlat}
          </>
        )}
      </Button>
    </div>
  );
}
