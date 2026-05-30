import {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Map, {
  Source,
  Layer,
  NavigationControl,
  Popup,
  useMap,
} from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import type { LngLatBoundsLike, MapMouseEvent } from 'maplibre-gl';
import type { MapIncident } from '@/types';
import type { MapIncidentPin } from '@/lib/mapIncidentPin';
import { useMapStore, type IncidentMarkerMode } from '@/stores/mapStore';
import { useFilteredMapIncidents } from '@/hooks/useFilteredMapIncidents';
import { useMapIncidentPins } from '@/hooks/useMapIncidentPins';
import {
  NARIMANOV_CENTER,
  MAP_3D_VIEW,
  getActiveMapRegion,
  getActiveMapRegionBoundsLngLat,
} from '@/lib/mapConfig';
import type { NarimanovRayonData } from '@/lib/narimanovRayon';
import { priorityWeightExpression } from '@/lib/mapLayerExpressions';
import { Map3DStyleEnhancer } from '@/components/map/Map3DStyleEnhancer';
import { CreateIncidentDraftMarker3D } from '@/components/map/CreateIncidentDraftMarker3D';
import { IncidentMapMarkers3D } from '@/components/map/IncidentMapMarkers3D';
import { DistrictHighlight3D } from '@/components/map/DistrictHighlight3D';
import { DistrictZones3D } from '@/components/map/DistrictZones3D';
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
import { getMaplibreBasemapStyle } from '@/lib/map3dBasemap';
import { MAP_DISTRICT_COLOR } from '@/lib/mapPalette';
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
    baseMap,
    visiblePlaceTypes,
    openIncident,
    map3dFlatView,
    incidentCreateMode,
    setIncidentCreateLocation,
  } = useMapStore();
  const filtered = useFilteredMapIncidents(incidents, narimanovRayon.feature);
  const pins = useMapIncidentPins(filtered);
  const [placePopup, setPlacePopup] = useState<PlacePopupState | null>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (map3dFlatView) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    } else {
      map.easeTo({
        pitch: MAP_3D_VIEW.pitch,
        bearing: MAP_3D_VIEW.bearing,
        duration: 600,
      });
    }
  }, [map3dFlatView]);

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
      features: pins.map((pin) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
        properties: {
          id: pin.incident.id,
          reportCount: pin.incident.reportCount,
          status: pin.incident.status,
          priority: pin.incident.priority,
        },
      })),
    };
  }, [pins]);

  const handlePinClick = useCallback(
    (pin: MapIncidentPin) => {
      if (incidentCreateMode !== false) return;
      openIncident(pin.incident.id);
    },
    [openIncident, incidentCreateMode],
  );

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      if (incidentCreateMode === 'pick') {
        setIncidentCreateLocation(e.lngLat.lat, e.lngLat.lng);
        return;
      }

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
    },
    [
      incidentCreateMode,
      setIncidentCreateLocation,
      showPlaces,
      hasInstitutionBuildings,
      usePlacePointsFallback,
    ],
  );

  const interactiveLayerIds = [
    ...(showPlaces && hasInstitutionBuildings
      ? [INSTITUTION_BUILDINGS_LAYER_ID]
      : []),
    ...(usePlacePointsFallback ? [PLACES_LAYER_ID] : []),
  ];

  return (
    <div
      className={
        incidentCreateMode === 'pick'
          ? 'relative h-full w-full cursor-crosshair incident-map-3d'
          : 'relative h-full w-full incident-map-3d'
      }
      style={
        { '--map-district-color': MAP_DISTRICT_COLOR } as CSSProperties
      }
    >
      <Map
        ref={mapRef}
        mapStyle={getMaplibreBasemapStyle(baseMap)}
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

        <Source id={INCIDENTS_SOURCE} type="geojson" data={incidentsGeoJson}>
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

        </Source>

        <DistrictZones3D rayon={narimanovRayon} />
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

        <IncidentMapMarkers3D
          pins={pins}
          markerMode={markerMode}
          showClusters={showClusters}
          onPinClick={handlePinClick}
        />

        <CreateIncidentDraftMarker3D />

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
    </div>
  );
}
