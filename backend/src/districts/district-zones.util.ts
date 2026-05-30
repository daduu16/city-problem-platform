import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { featureCollection, point, polygon } from '@turf/helpers';
import intersect from '@turf/intersect';

export type DistrictZoneId = 'A' | 'B' | 'C' | 'D';

export type DistrictZone = {
  id: DistrictZoneId;
  label: string;
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  color: string;
  fillOpacity: number;
};

export const DISTRICT_ZONE_STYLES: Record<
  DistrictZoneId,
  { color: string; fillOpacity: number }
> = {
  A: { color: '#5d5fef', fillOpacity: 0.16 },
  B: { color: '#ff4d4f', fillOpacity: 0.16 },
  C: { color: '#faad14', fillOpacity: 0.16 },
  D: { color: '#52c41a', fillOpacity: 0.16 },
};

const ZONE_ORDER: DistrictZoneId[] = ['A', 'B', 'C', 'D'];

const districtZonesCache = new WeakMap<
  GeoJSON.Feature<GeoJSON.Polygon>,
  DistrictZone[]
>();

type PolyFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

export function getDistrictZonesCached(
  districtFeature: GeoJSON.Feature<GeoJSON.Polygon>,
): DistrictZone[] {
  const cached = districtZonesCache.get(districtFeature);
  if (cached) return cached;
  const zones = buildDistrictZones(districtFeature);
  districtZonesCache.set(districtFeature, zones);
  return zones;
}

function resolveDistrictZoneForPoint(
  lat: number,
  lng: number,
  zones: DistrictZone[],
): DistrictZoneId {
  const pt = point([lng, lat]);
  for (const zone of zones) {
    if (booleanPointInPolygon(pt, zone.feature)) return zone.id;
  }
  return 'A';
}

function clipFeatures(
  ...features: Array<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>>
): PolyFeature | null {
  const valid = features.filter((f) => f.geometry);
  if (valid.length < 2) return null;
  return intersect(featureCollection(valid)) as PolyFeature | null;
}

function clipToBox(
  source: PolyFeature,
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): PolyFeature | null {
  const box = polygon([
    [
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ],
  ]);
  return clipFeatures(source, box);
}

function polygonArea(feature: PolyFeature | GeoJSON.Feature<GeoJSON.Polygon> | null): number {
  if (!feature?.geometry) return 0;
  return area(feature);
}

function findLngSplit(source: GeoJSON.Feature<GeoJSON.Polygon>, targetRatio: number): number {
  const [minLng, minLat, maxLng, maxLat] = bbox(source);
  const total = polygonArea(source);
  if (total <= 0) return (minLng + maxLng) / 2;

  let lo = minLng;
  let hi = maxLng;

  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const west = clipToBox(source, minLng, minLat, mid, maxLat);
    const ratio = polygonArea(west) / total;
    if (ratio < targetRatio) lo = mid;
    else hi = mid;
  }

  return (lo + hi) / 2;
}

function findLatSplit(piece: PolyFeature, targetRatio: number): number {
  const [minLng, minLat, maxLng, maxLat] = bbox(piece);
  const total = polygonArea(piece);
  if (total <= 0) return (minLat + maxLat) / 2;

  let lo = minLat;
  let hi = maxLat;

  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const south = clipToBox(piece, minLng, minLat, maxLng, mid);
    const ratio = polygonArea(south) / total;
    if (ratio < targetRatio) lo = mid;
    else hi = mid;
  }

  return (lo + hi) / 2;
}

function toZone(id: DistrictZoneId, feature: PolyFeature | null): DistrictZone | null {
  if (!feature?.geometry) return null;
  const style = DISTRICT_ZONE_STYLES[id];
  return {
    id,
    label: `Zona ${id}`,
    feature,
    color: style.color,
    fillOpacity: style.fillOpacity,
  };
}

export function buildDistrictZones(
  districtFeature: GeoJSON.Feature<GeoJSON.Polygon>,
): DistrictZone[] {
  const [minLng, minLat, maxLng, maxLat] = bbox(districtFeature);

  const splitLng = findLngSplit(districtFeature, 0.5);

  const west = clipToBox(districtFeature, minLng, minLat, splitLng, maxLat);
  const east = clipToBox(districtFeature, splitLng, minLat, maxLng, maxLat);

  if (!west?.geometry || !east?.geometry) {
    return fallbackQuadrantZones(districtFeature);
  }

  const latWest = findLatSplit(west, 0.5);
  const latEast = findLatSplit(east, 0.5);

  const [wMinLng, , wMaxLng] = bbox(west);
  const [eMinLng, , eMaxLng] = bbox(east);

  const zoneA = clipToBox(districtFeature, wMinLng, latWest, wMaxLng, maxLat);
  const zoneC = clipToBox(districtFeature, wMinLng, minLat, wMaxLng, latWest);
  const zoneB = clipToBox(districtFeature, eMinLng, latEast, eMaxLng, maxLat);
  const zoneD = clipToBox(districtFeature, eMinLng, minLat, eMaxLng, latEast);

  const zones = ZONE_ORDER.map((id) => {
    switch (id) {
      case 'A':
        return toZone('A', zoneA);
      case 'B':
        return toZone('B', zoneB);
      case 'C':
        return toZone('C', zoneC);
      case 'D':
        return toZone('D', zoneD);
    }
  }).filter((z): z is DistrictZone => z != null);

  if (zones.length === 4) return zones;
  return fallbackQuadrantZones(districtFeature);
}

function fallbackQuadrantZones(
  districtFeature: GeoJSON.Feature<GeoJSON.Polygon>,
): DistrictZone[] {
  const [minLng, minLat, maxLng, maxLat] = bbox(districtFeature);
  const midLng = (minLng + maxLng) / 2;
  const midLat = (minLat + maxLat) / 2;

  const specs: Array<{
    id: DistrictZoneId;
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  }> = [
    { id: 'A', minLng, minLat: midLat, maxLng: midLng, maxLat },
    { id: 'B', minLng: midLng, minLat: midLat, maxLng, maxLat },
    { id: 'C', minLng, minLat, maxLng: midLng, maxLat: midLat },
    { id: 'D', minLng: midLng, minLat, maxLng, maxLat: midLat },
  ];

  return ZONE_ORDER.map((id) => {
    const s = specs.find((x) => x.id === id)!;
    const clipped = clipToBox(districtFeature, s.minLng, s.minLat, s.maxLng, s.maxLat);
    return toZone(id, clipped);
  }).filter((z): z is DistrictZone => z != null);
}

export function getDistrictZoneForPoint(
  lat: number,
  lng: number,
  districtFeature: GeoJSON.Feature<GeoJSON.Polygon>,
): DistrictZoneId {
  const zones = getDistrictZonesCached(districtFeature);
  return resolveDistrictZoneForPoint(lat, lng, zones);
}

export function zoneCentroid(zone: DistrictZone): { lat: number; lng: number } {
  const [minLng, minLat, maxLng, maxLat] = bbox(zone.feature);
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

export { ZONE_ORDER as DISTRICT_ZONE_ORDER };
