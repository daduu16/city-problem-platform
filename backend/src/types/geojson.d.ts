declare namespace GeoJSON {
  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
  }

  interface Feature {
    type: 'Feature';
    geometry: Geometry;
    properties: Record<string, unknown> | null;
  }

  interface Geometry {
    type: string;
    coordinates: unknown;
  }
}
