import osmtogeojson from 'osmtogeojson';
import type { BuildingLegendId } from '@/lib/buildingTypeStyles';
import { getOsmFeatureId } from '@/lib/matchPlacesToBuildings';

export interface Bbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

const RESIDENTIAL = new Set([
  'residential',
  'house',
  'apartments',
  'detached',
  'terrace',
  'dormitory',
  'bungalow',
  'static_caravan',
  'yes',
  'hut',
  'cabin',
]);

const COMMERCIAL = new Set([
  'commercial',
  'supermarket',
  'mall',
  'shop',
  'store',
]);

const INDUSTRIAL = new Set([
  'industrial',
  'factory',
  'manufacture',
  'warehouse',
  'brewery',
]);

const RELIGIOUS = new Set([
  'church',
  'cathedral',
  'chapel',
  'mosque',
  'temple',
  'synagogue',
  'religious',
  'monastery',
]);

const SCHOOL = new Set([
  'school',
  'university',
  'college',
  'kindergarten',
  'education',
]);

const HOSPITAL = new Set(['hospital', 'clinic', 'healthcare']);

const GOVERNMENT = new Set([
  'government',
  'public',
  'civic',
  'fire_station',
  'police',
  'townhall',
]);

const GARAGE = new Set(['garage', 'garages', 'parking', 'carport', 'shed']);

/** Map OSM `building=*` tag to legend category. */
export function normalizeBuildingType(
  raw: string | undefined,
): BuildingLegendId {
  const tag = (raw || 'yes').toLowerCase().trim();
  if (tag === 'retail') return 'retail';
  if (tag === 'office') return 'office';
  if (tag === 'hotel' || tag === 'motel') return 'hotel';
  if (RESIDENTIAL.has(tag)) return 'residential';
  if (COMMERCIAL.has(tag)) return 'commercial';
  if (INDUSTRIAL.has(tag)) return 'industrial';
  if (tag === 'warehouse') return 'warehouse';
  if (RELIGIOUS.has(tag)) return 'religious';
  if (SCHOOL.has(tag)) return 'school';
  if (HOSPITAL.has(tag)) return 'hospital';
  if (GOVERNMENT.has(tag)) return 'government';
  if (GARAGE.has(tag)) return 'garage';
  return 'other';
}

export function estimateBuildingHeightMeters(
  props: Record<string, unknown>,
): number {
  const heightRaw = props.height ?? props['building:height'];
  if (heightRaw != null) {
    const h = parseFloat(String(heightRaw).replace(/m$/i, '').trim());
    if (!Number.isNaN(h) && h > 0) return Math.min(h, 150);
  }

  const levelsRaw = props['building:levels'] ?? props.levels;
  if (levelsRaw != null) {
    const levels = parseInt(String(levelsRaw), 10);
    if (!Number.isNaN(levels) && levels > 0) return Math.min(levels * 3.2, 150);
  }

  return 12;
}

export function bboxFromLatLngPositions(
  positions: [number, number][],
): Bbox {
  const lats = positions.map(([lat]) => lat);
  const lngs = positions.map(([, lng]) => lng);
  const pad = 0.008;
  return {
    south: Math.min(...lats) - pad,
    west: Math.min(...lngs) - pad,
    north: Math.max(...lats) + pad,
    east: Math.max(...lngs) + pad,
  };
}

function overpassQuery(bbox: Bbox): string {
  const { south, west, north, east } = bbox;
  return `[out:json][timeout:90];
(
  way["building"](${south},${west},${north},${east});
  relation["type"="multipolygon"]["building"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;`;
}

export async function fetchOsmBuildingsGeoJson(
  bbox: Bbox,
): Promise<GeoJSON.FeatureCollection> {
  const query = overpassQuery(bbox);
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass API: ${res.status}`);
  }

  const osmJson = await res.json();
  const geojson = osmtogeojson(osmJson) as GeoJSON.FeatureCollection;

  const features: GeoJSON.Feature[] = [];

  for (const feature of geojson.features) {
    if (!feature.geometry) continue;
    if (
      feature.geometry.type !== 'Polygon' &&
      feature.geometry.type !== 'MultiPolygon'
    ) {
      continue;
    }

    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const buildingTag =
      (props.building as string | undefined) ??
      (props['building:use'] as string | undefined);

    features.push({
      ...feature,
      properties: {
        buildingType: normalizeBuildingType(buildingTag),
        height: estimateBuildingHeightMeters(props),
        osmId: getOsmFeatureId(feature) ?? undefined,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}
