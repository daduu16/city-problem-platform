import type { MapLayerKey } from '@/stores/mapStore';

/** Category key → frontend map layer toggle */
export const categoryKeyToLayer: Partial<Record<string, MapLayerKey>> = {
  water: 'water',
  gas: 'gas',
  electricity: 'electricity',
  road_surface: 'roads',
  asphalt_repair: 'roads',
  broken_lamps: 'lighting',
  dark_areas: 'lighting',
  street_dirt: 'sanitation',
  overflow_bins: 'sanitation',
  floods: 'floods',
  ice: 'weather',
  storm_damage: 'weather',
  dry_zones: 'greenery',
  tree_fall: 'greenery',
  mowing: 'greenery',
};
