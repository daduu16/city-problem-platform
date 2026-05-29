import { useQuery } from '@tanstack/react-query';
import {
  NARIMANOV_RAYON_GEOJSON_URL,
  parseNarimanovRayonCollection,
  type NarimanovRayonData,
} from '@/lib/narimanovRayon';

async function loadNarimanovRayon(): Promise<NarimanovRayonData> {
  const res = await fetch(NARIMANOV_RAYON_GEOJSON_URL);
  if (!res.ok) {
    throw new Error(`Failed to load Narimanov rayon GeoJSON (${res.status})`);
  }
  const collection = (await res.json()) as GeoJSON.FeatureCollection;
  const data = parseNarimanovRayonCollection(collection);
  if (!data) {
    throw new Error('Narimanov district not found in GeoJSON');
  }
  return data;
}

export function useNarimanovRayon() {
  return useQuery({
    queryKey: ['narimanov-rayon'],
    queryFn: loadNarimanovRayon,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
