import { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { filterMatchedBuildingsByVisibleTypes } from '@/lib/matchPlacesToBuildings';
import { getPlaceTypeColor, getPlaceTypeLabel } from '@/lib/placeTypeStyles';

const INSTITUTION_PANE = 'institution-buildings-pane';

interface Props {
  data: GeoJSON.FeatureCollection;
  visible: boolean;
  visibleTypes: Record<string, boolean>;
}

function popupHtml(props: Record<string, unknown>): string {
  const placeName = String(props.placeName ?? '');
  const placeType = String(props.placeType ?? '');
  return `<strong>${placeName}</strong><br/>
    <span style="font-size:11px;color:#64748b">${getPlaceTypeLabel(placeType)}</span>`;
}

export function InstitutionBuildings2D({ data, visible, visibleTypes }: Props) {
  const map = useMap();

  const filtered = useMemo(
    () => filterMatchedBuildingsByVisibleTypes(data, visibleTypes),
    [data, visibleTypes],
  );

  useEffect(() => {
    if (!map.getPane(INSTITUTION_PANE)) {
      map.createPane(INSTITUTION_PANE);
      const pane = map.getPane(INSTITUTION_PANE);
      if (pane) pane.style.zIndex = '420';
    }
  }, [map]);

  useEffect(() => {
    if (!visible) return;

    const layer = L.geoJSON(filtered, {
      pane: INSTITUTION_PANE,
      style: (feature) => {
        const placeType = String(feature?.properties?.placeType ?? '');
        const color = getPlaceTypeColor(placeType);
        return {
          color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.78,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        if (feature.properties) {
          featureLayer.bindPopup(popupHtml(feature.properties));
        }
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, filtered, visible]);

  return null;
}
