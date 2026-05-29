/** Properties from azrbaycan_rayonlar.geojson (opendata.az) */
export interface RayonGeoProperties {
  OBJECTID: number;
  Name_AZ: string;
  Name: string;
  Name_RU: string;
  PARENT_ID: string;
  Code_OSM: string;
  Area: number;
  Shape_Leng: number;
  Shape_Length: number;
  Shape_Area: number;
  ID: number;
  Upper_case: string;
}

/** Served by backend: GET /districts/narimanov */
export const OPENDATA_RAYONLAR_PACKAGE_URL =
  'https://admin.opendata.az/api/3/action/package_show?id=azerbaycanin-rayonlari';

export interface NarimanovRayonData {
  feature: GeoJSON.Feature<GeoJSON.Polygon, RayonGeoProperties>;
  positions: [number, number][];
  properties: RayonGeoProperties;
}

export function polygonPositionsFromFeature(
  feature: GeoJSON.Feature<GeoJSON.Polygon>,
): [number, number][] {
  const ring = feature.geometry.coordinates[0] as [number, number][];
  return ring.map(([lng, lat]) => [lat, lng]);
}

export function parseNarimanovRayonCollection(
  collection: GeoJSON.FeatureCollection,
): NarimanovRayonData | null {
  const feature = collection.features.find(
    (f) =>
      f.properties &&
      (f.properties as RayonGeoProperties).Name === 'Narimanov',
  ) as GeoJSON.Feature<GeoJSON.Polygon, RayonGeoProperties> | undefined;

  if (!feature || feature.geometry.type !== 'Polygon') return null;

  return {
    feature,
    properties: feature.properties,
    positions: polygonPositionsFromFeature(feature),
  };
}

/** Area field is in km² (Azerbaijan districts open dataset). */
export function formatRayonAreaKm2(areaKm2: number): string {
  return `${areaKm2.toFixed(2)} km²`;
}

/** Rough geodesic conversion for Shape_Length stored in decimal degrees. */
export function shapeLengthDegToKm(lengthDeg: number, lat = 40.4093): number {
  const latRad = (lat * Math.PI) / 180;
  const kmPerDeg =
    111.32 * ((1 + Math.cos(latRad)) / 2);
  return lengthDeg * kmPerDeg;
}

export function formatRayonPerimeterKm(lengthDeg: number, lat?: number): string {
  const km = shapeLengthDegToKm(lengthDeg, lat);
  return `~${km.toFixed(1)} km`;
}
