import { useMemo } from 'react';
import { useOsmBuildingsGeoJson } from '@/hooks/useOsmBuildingsGeoJson';
import { matchPlacesToBuildings } from '@/lib/matchPlacesToBuildings';

export function useInstitutionBuildingsGeoJson(
  places: GeoJSON.FeatureCollection | undefined,
  districtPositions: [number, number][] | undefined,
) {
  const buildingsQuery = useOsmBuildingsGeoJson(districtPositions);

  const matched = useMemo(() => {
    if (!places?.features.length || !buildingsQuery.data?.features.length) {
      return undefined;
    }
    return matchPlacesToBuildings(places, buildingsQuery.data);
  }, [places, buildingsQuery.data]);

  return {
    data: matched,
    isLoading: buildingsQuery.isLoading,
    isError: buildingsQuery.isError,
    error: buildingsQuery.error,
    refetch: buildingsQuery.refetch,
    matchStats: matched
      ? {
          matched: matched.features.length,
          places: places?.features.length ?? 0,
          buildings: buildingsQuery.data?.features.length ?? 0,
        }
      : null,
  };
}
