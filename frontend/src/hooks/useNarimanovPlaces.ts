import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { enrichPlacesGeoJson } from '@/lib/placeTypeStyles';

export interface PlacesManifest {
  district: string;
  districtAz: string;
  featureCount: number;
  typeCount: number;
  types: Array<{ type: string; count: number; file: string }>;
}

async function loadNarimanovPlaces(): Promise<GeoJSON.FeatureCollection> {
  const res = await api.get<GeoJSON.FeatureCollection>('/places/narimanov');
  return enrichPlacesGeoJson(res.data);
}

async function loadPlacesManifest(): Promise<PlacesManifest> {
  const res = await api.get<PlacesManifest>('/places/narimanov/manifest');
  return res.data;
}

export function useNarimanovPlaces() {
  return useQuery({
    queryKey: ['places', 'narimanov'],
    queryFn: loadNarimanovPlaces,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function usePlacesManifest() {
  return useQuery({
    queryKey: ['places', 'narimanov', 'manifest'],
    queryFn: loadPlacesManifest,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
