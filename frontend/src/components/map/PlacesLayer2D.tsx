import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_POINT_STROKE } from '@/lib/mapPalette';
import {
  filterPlacesByVisibleTypes,
  getPlaceTypeColor,
  getPlaceTypeLabel,
  type PlaceProperties,
} from '@/lib/placeTypeStyles';

interface Props {
  data: GeoJSON.FeatureCollection;
  visible: boolean;
  visibleTypes: Record<string, boolean>;
}

function placePopupHtml(props: PlaceProperties): string {
  const name =
    (props.NAME_AZ && props.NAME_AZ.trim()) ||
    props.NAME ||
    getPlaceTypeLabel(props.TYPE);
  const address = [props.STRT_NAME, props.STRT_ADDR].filter(Boolean).join(', ');
  return `<strong>${name}</strong><br/>
    <span style="font-size:11px;color:#64748b">${getPlaceTypeLabel(props.TYPE)}</span>
    ${address ? `<br/><span style="font-size:11px">${address}</span>` : ''}`;
}

export function PlacesLayer2D({ data, visible, visibleTypes }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const filtered = filterPlacesByVisibleTypes(data, visibleTypes);
    const layer = L.geoJSON(filtered, {
      pointToLayer: (feature, latlng) => {
        const props = feature.properties as PlaceProperties;
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: getPlaceTypeColor(props.TYPE),
          color: MAP_POINT_STROKE,
          weight: 1,
          fillOpacity: 0.88,
        });
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties as PlaceProperties;
        featureLayer.bindPopup(placePopupHtml(props));
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, data, visible, visibleTypes]);

  return null;
}
