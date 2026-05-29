import { useQuery } from '@tanstack/react-query';
import {
  bboxFromLatLngPositions,
  fetchOsmBuildingsGeoJson,
  type Bbox,
} from '@/lib/buildingOsm';

export function useOsmBuildingsGeoJson(positions: [number, number][] | undefined) {
  const bbox: Bbox | null = positions?.length
    ? bboxFromLatLngPositions(positions)
    : null;

  return useQuery({
    queryKey: ['osm-buildings', bbox],
    queryFn: () => fetchOsmBuildingsGeoJson(bbox!),
    enabled: !!bbox,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
