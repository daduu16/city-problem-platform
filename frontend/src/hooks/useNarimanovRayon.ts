import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NarimanovRayonData } from '@/lib/narimanovRayon';

interface NarimanovDistrictApiResponse {
  feature: GeoJSON.Feature<GeoJSON.Polygon>;
  positions: [number, number][];
  properties: NarimanovRayonData['properties'];
  vertexCount: number;
  areaKm2: number;
  perimeterKmEstimate: number;
  lastUpdated: string;
}

async function loadNarimanovRayon(): Promise<NarimanovRayonData> {
  const res = await api.get<NarimanovDistrictApiResponse>('/districts/narimanov');
  const { feature, positions, properties } = res.data;
  return {
    feature: feature as NarimanovRayonData['feature'],
    positions,
    properties,
  };
}

export function useNarimanovRayon() {
  return useQuery({
    queryKey: ['districts', 'narimanov'],
    queryFn: loadNarimanovRayon,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
