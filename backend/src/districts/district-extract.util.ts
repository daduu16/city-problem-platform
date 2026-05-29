import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export const NARIMANOV_RAYON_NAME = 'Narimanov';
export const NARIMANOV_RAYON_NAME_AZ = 'Nərimanov';

export interface RayonGeoProperties {
  OBJECTID: number;
  Name_AZ: string;
  Name: string;
  Name_RU: string;
  PARENT_ID?: string;
  Code_OSM?: string;
  Area: number;
  Shape_Leng?: number;
  Shape_Length: number;
  Shape_Area?: number;
  ID?: number;
  Upper_case?: string;
}

export interface DistrictManifest {
  district: string;
  districtAz: string;
  city: string;
  areaKm2: number;
  perimeterKmEstimate: number;
  vertexCount: number;
  lastUpdated: string;
  sourceFile: string;
  properties: RayonGeoProperties;
}

export interface NarimanovDistrictData {
  feature: GeoJSON.Feature;
  positions: [number, number][];
  properties: RayonGeoProperties;
  manifest: DistrictManifest;
}

function polygonRing(feature: GeoJSON.Feature): [number, number][] {
  if (feature.geometry.type !== 'Polygon') {
    throw new Error('Expected Polygon geometry for district boundary');
  }
  const coords = feature.geometry.coordinates as [number, number][][];
  return coords[0] ?? [];
}

export function polygonPositionsFromFeature(
  feature: GeoJSON.Feature,
): [number, number][] {
  return polygonRing(feature).map(([lng, lat]) => [lat, lng]);
}

export function shapeLengthDegToKm(lengthDeg: number, lat = 40.4093): number {
  const latRad = (lat * Math.PI) / 180;
  const kmPerDeg = 111.32 * ((1 + Math.cos(latRad)) / 2);
  return lengthDeg * kmPerDeg;
}

function rayonProps(properties: Record<string, unknown> | null): RayonGeoProperties | null {
  if (!properties) return null;
  return properties as unknown as RayonGeoProperties;
}

function findNarimanovFeature(
  collection: GeoJSON.FeatureCollection,
): GeoJSON.Feature | null {
  const byName = collection.features.find((f) => {
    const p = rayonProps(f.properties);
    return p?.Name === NARIMANOV_RAYON_NAME;
  });

  const feature =
    byName ??
    (collection.features.length === 1 ? collection.features[0] : undefined);

  if (!feature || feature.geometry.type !== 'Polygon') return null;
  return feature;
}

export async function extractNarimanovDistrict(
  sourceGeoJsonPath: string,
  outputDir: string,
): Promise<NarimanovDistrictData> {
  const raw = await readFile(sourceGeoJsonPath, 'utf8');
  const collection = JSON.parse(raw) as GeoJSON.FeatureCollection;
  const feature = findNarimanovFeature(collection);

  if (!feature) {
    throw new Error('Narimanov district not found in rayon GeoJSON');
  }

  const properties = rayonProps(feature.properties);
  if (!properties) {
    throw new Error('Narimanov district feature has no properties');
  }

  const positions = polygonPositionsFromFeature(feature);
  const vertexCount = polygonRing(feature).length;
  const centerLat =
    positions.reduce((sum, p) => sum + p[0], 0) / (positions.length || 1);

  const manifest: DistrictManifest = {
    district: NARIMANOV_RAYON_NAME,
    districtAz: NARIMANOV_RAYON_NAME_AZ,
    city: 'Baku',
    areaKm2: properties.Area,
    perimeterKmEstimate: shapeLengthDegToKm(
      properties.Shape_Length,
      centerLat,
    ),
    vertexCount,
    lastUpdated: new Date().toISOString(),
    sourceFile: path.basename(sourceGeoJsonPath),
    properties,
  };

  await mkdir(outputDir, { recursive: true });

  const boundaryCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [feature],
  };

  await writeFile(
    path.join(outputDir, 'boundary.geojson'),
    JSON.stringify(boundaryCollection),
    'utf8',
  );
  await writeFile(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  );

  return { feature, positions, properties, manifest };
}

export function defaultDistrictDataDir(): string {
  return path.join(process.cwd(), 'data', 'narimanov-district');
}

export function defaultDistrictSourcePath(): string {
  return path.join(
    process.cwd(),
    '..',
    'frontend',
    'azrbaycan_rayonlar.geojson',
  );
}

export function fallbackDistrictSourcePath(): string {
  return path.join(
    process.cwd(),
    '..',
    'frontend',
    'public',
    'narimanov-rayon.geojson',
  );
}

/** Prefer full country file when present, otherwise pre-extracted Narimanov slice. */
export async function resolveDistrictSourcePath(
  configuredPath?: string,
): Promise<string> {
  const candidate = configuredPath ?? defaultDistrictSourcePath();
  const { access } = await import('fs/promises');
  try {
    await access(candidate);
    return candidate;
  } catch {
    return fallbackDistrictSourcePath();
  }
}
