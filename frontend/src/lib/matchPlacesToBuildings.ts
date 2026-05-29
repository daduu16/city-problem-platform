import type { PlaceProperties } from '@/lib/placeTypeStyles';

export interface MatchedBuildingProperties {
  buildingType?: string;
  height?: number;
  osmId?: string;
  institutionId: string;
  placeType: string;
  placeName: string;
  placeObjectId?: number;
  matchMethod: 'code_osm' | 'contains' | 'nearest';
}

interface Bbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface BuildingIndex {
  idx: number;
  rings: [number, number][][];
  bbox: Bbox;
  centroid: [number, number];
  area: number;
  osmId: string | null;
}

interface MatchCandidate {
  buildingIdx: number;
  props: PlaceProperties & { placeType?: string };
  method: MatchedBuildingProperties['matchMethod'];
  /** Lower score wins when multiple places target the same building. */
  score: number;
}

/** Max distance when point is not inside a building footprint. */
const NEAREST_MATCH_METERS = 16;

function getPolygonRings(feature: GeoJSON.Feature): [number, number][][] {
  const geom = feature.geometry;
  if (geom.type === 'Polygon') {
    const ring = geom.coordinates[0] as unknown as [number, number][];
    return ring?.length ? [ring] : [];
  }
  if (geom.type === 'MultiPolygon') {
    return (geom.coordinates as [number, number][][][])
      .map((poly) => poly[0])
      .filter((ring) => ring?.length);
  }
  return [];
}

function ringAreaApprox(ring: [number, number][]): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2);
}

function bboxFromRings(rings: [number, number][][]): Bbox {
  const coords = rings.flat();
  const lngs = coords.map(([lng]) => lng);
  const lats = coords.map(([, lat]) => lat);
  return {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  };
}

function ringCentroid(ring: [number, number][]): [number, number] {
  let sumLng = 0;
  let sumLat = 0;
  const n = ring.length || 1;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / n, sumLat / n];
}

function bboxContains(b: Bbox, lng: number, lat: number): boolean {
  return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
}

export function pointInPolygon(
  lng: number,
  lat: number,
  ring: [number, number][],
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function getOsmFeatureId(feature: GeoJSON.Feature): string | null {
  if (typeof feature.id === 'string' && feature.id.length > 0) {
    return feature.id;
  }
  const props = feature.properties ?? {};
  const raw = props.osmId ?? props['@id'];
  if (raw == null || raw === '') return null;
  const s = String(raw);
  if (s.includes('/')) return s;
  return `way/${s}`;
}

/** Drop duplicate OSM footprints (common in Overpass multipolygon output). */
export function dedupeOsmBuildings(
  buildings: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  const seen = new Set<string>();
  const features: GeoJSON.Feature[] = [];

  for (const feature of buildings.features) {
    const osmId = getOsmFeatureId(feature);
    const key = osmId ?? `geom-${features.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    features.push(feature);
  }

  return { type: 'FeatureCollection', features };
}

function normalizeCodeOsmKeys(code: string | number): string[] {
  const raw = String(code).trim();
  const numeric = raw.replace(/^(way|node|relation)\//i, '');
  return [
    raw,
    numeric,
    `way/${numeric}`,
    `node/${numeric}`,
    `relation/${numeric}`,
  ];
}

function placeDisplayName(props: PlaceProperties): string {
  const az = props.NAME_AZ?.trim();
  if (az && az !== ' ') return az;
  return props.NAME?.trim() || props.TYPE;
}

function findBuildingIndex(
  buildingIndex: BuildingIndex[],
  lng: number,
  lat: number,
): BuildingIndex | null {
  let best: { entry: BuildingIndex; area: number } | null = null;

  for (const entry of buildingIndex) {
    if (!bboxContains(entry.bbox, lng, lat)) continue;
    if (!pointInPolygon(lng, lat, entry.rings[0])) continue;
    if (!best || entry.area < best.area) {
      best = { entry, area: entry.area };
    }
  }

  return best?.entry ?? null;
}

function findNearestBuilding(
  buildingIndex: BuildingIndex[],
  lng: number,
  lat: number,
): { entry: BuildingIndex; dist: number } | null {
  let best: { entry: BuildingIndex; dist: number } | null = null;

  for (const entry of buildingIndex) {
    const dist = haversineMeters(
      lat,
      lng,
      entry.centroid[1],
      entry.centroid[0],
    );
    if (dist > NEAREST_MATCH_METERS) continue;
    if (!best || dist < best.dist) {
      best = { entry, dist };
    }
  }

  return best;
}

/**
 * Assigns institution TYPE to OSM polygons — one stable winner per building.
 */
export function matchPlacesToBuildings(
  places: GeoJSON.FeatureCollection,
  buildings: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  const deduped = dedupeOsmBuildings(buildings);

  const buildingIndex: BuildingIndex[] = deduped.features
    .map((feature, idx) => {
      const rings = getPolygonRings(feature);
      if (!rings.length || !rings[0]?.length) return null;
      const ring = rings[0];
      return {
        idx,
        rings,
        bbox: bboxFromRings(rings),
        centroid: ringCentroid(ring),
        area: ringAreaApprox(ring),
        osmId: getOsmFeatureId(feature),
      };
    })
    .filter((x): x is BuildingIndex => x != null);

  const osmIdToIdx = new Map<string, number>();
  for (const entry of buildingIndex) {
    if (!entry.osmId) continue;
    for (const key of normalizeCodeOsmKeys(entry.osmId)) {
      if (!osmIdToIdx.has(key)) osmIdToIdx.set(key, entry.idx);
    }
  }

  const candidates: MatchCandidate[] = [];

  for (const place of places.features) {
    if (place.geometry.type !== 'Point') continue;
    const props = place.properties as PlaceProperties & { placeType?: string };
    const placeType = props.placeType ?? props.TYPE;
    if (!placeType) continue;

    const [lng, lat] = place.geometry.coordinates;

    if (props.Code_OSM != null && String(props.Code_OSM).trim() !== '') {
      for (const key of normalizeCodeOsmKeys(props.Code_OSM)) {
        const idx = osmIdToIdx.get(key);
        if (idx != null) {
          candidates.push({
            buildingIdx: idx,
            props,
            method: 'code_osm',
            score: 0,
          });
          break;
        }
      }
      continue;
    }

    const contains = findBuildingIndex(buildingIndex, lng, lat);
    if (contains) {
      const dist = haversineMeters(
        lat,
        lng,
        contains.centroid[1],
        contains.centroid[0],
      );
      candidates.push({
        buildingIdx: contains.idx,
        props,
        method: 'contains',
        score: 1 + dist + contains.area * 1e8,
      });
      continue;
    }

    const nearest = findNearestBuilding(buildingIndex, lng, lat);
    if (nearest) {
      candidates.push({
        buildingIdx: nearest.entry.idx,
        props,
        method: 'nearest',
        score: 50 + nearest.dist,
      });
    }
  }

  const winnerByBuilding = new Map<number, MatchCandidate>();
  for (const candidate of candidates) {
    const prev = winnerByBuilding.get(candidate.buildingIdx);
    if (!prev || candidate.score < prev.score) {
      winnerByBuilding.set(candidate.buildingIdx, candidate);
    }
  }

  const features: GeoJSON.Feature[] = [];

  for (const [idx, match] of winnerByBuilding) {
    const building = deduped.features[idx];
    if (!building) continue;

    const osmId = getOsmFeatureId(building);
    const institutionId = osmId ?? `building-${idx}`;
    const placeType = match.props.placeType ?? match.props.TYPE;
    const rawHeight = (building.properties as { height?: unknown })?.height;
    const height =
      typeof rawHeight === 'number'
        ? rawHeight
        : parseFloat(String(rawHeight ?? '')) || 12;

    features.push({
      ...building,
      properties: {
        ...(building.properties ?? {}),
        institutionId,
        placeType,
        placeName: placeDisplayName(match.props),
        placeObjectId: match.props.OBJECTID,
        matchMethod: match.method,
        height,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export function filterMatchedBuildingsByVisibleTypes(
  collection: GeoJSON.FeatureCollection,
  visibleTypes: Record<string, boolean>,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.filter((f) => {
      const type = (f.properties as { placeType?: string })?.placeType;
      if (!type) return false;
      return visibleTypes[type] !== false;
    }),
  };
}
