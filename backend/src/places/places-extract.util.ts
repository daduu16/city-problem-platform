import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export const NARIMANOV_STATE = 'Narimanov';
export const NARIMANOV_STATE_AZ = 'Nərimanov';

export interface PlaceProperties {
  OBJECTID: number;
  CITY: string;
  STATE: string;
  STRT_NAME?: string;
  STRT_ADDR?: string;
  NAME: string;
  status?: string;
  NEW_ADDR?: string;
  COUNTRY: string;
  NAME_AZ?: string;
  STATE_AZ: string;
  STRT_N_AZ?: string;
  COUNTRY_AZ: string;
  CITY_AZ: string;
  TYPE: string;
  Code_OSM?: string | null;
}

export interface PlacesManifestTypeEntry {
  type: string;
  count: number;
  file: string;
}

export interface PlacesManifest {
  district: string;
  districtAz: string;
  city: string;
  featureCount: number;
  typeCount: number;
  lastUpdated: string;
  sourceFile: string;
  types: PlacesManifestTypeEntry[];
}

function placeProps(feature: GeoJSON.Feature): PlaceProperties | null {
  if (!feature.properties) return null;
  return feature.properties as unknown as PlaceProperties;
}

function isNarimanovFeature(feature: GeoJSON.Feature): boolean {
  const p = placeProps(feature);
  if (!p) return false;
  return p.STATE === NARIMANOV_STATE || p.STATE_AZ === NARIMANOV_STATE_AZ;
}

function safeTypeFilename(type: string): string {
  return type.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

export async function extractNarimanovPlacesByType(
  sourceGeoJsonPath: string,
  outputDir: string,
): Promise<PlacesManifest> {
  const raw = await readFile(sourceGeoJsonPath, 'utf8');
  const collection = JSON.parse(raw) as GeoJSON.FeatureCollection;

  const features = collection.features.filter(isNarimanovFeature);
  const byType = new Map<string, GeoJSON.Feature[]>();

  for (const feature of features) {
    const type = placeProps(feature)?.TYPE || 'UNKNOWN';
    const list = byType.get(type) ?? [];
    list.push(feature);
    byType.set(type, list);
  }

  const byTypeDir = path.join(outputDir, 'by-type');
  await mkdir(byTypeDir, { recursive: true });

  const types: PlacesManifestTypeEntry[] = [];

  for (const [type, typeFeatures] of [...byType.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const fileName = `${safeTypeFilename(type)}.geojson`;
    const relFile = `by-type/${fileName}`;
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: typeFeatures,
    };
    await writeFile(
      path.join(byTypeDir, fileName),
      JSON.stringify(fc),
      'utf8',
    );
    types.push({ type, count: typeFeatures.length, file: relFile });
  }

  const allCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features,
  };
  await writeFile(
    path.join(outputDir, 'all.geojson'),
    JSON.stringify(allCollection),
    'utf8',
  );

  const manifest: PlacesManifest = {
    district: NARIMANOV_STATE,
    districtAz: NARIMANOV_STATE_AZ,
    city: 'Baku',
    featureCount: features.length,
    typeCount: types.length,
    lastUpdated: new Date().toISOString(),
    sourceFile: path.basename(sourceGeoJsonPath),
    types,
  };

  await writeFile(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  );

  return manifest;
}

export function defaultPlacesDataDir(): string {
  return path.join(process.cwd(), 'data', 'narimanov-places');
}

export function defaultPlacesSourcePath(): string {
  return path.join(
    process.cwd(),
    '..',
    'frontend',
    'azrbaycanda_obyektlr_v_mkanlar.geojson',
  );
}
