export type IncidentScopeType = 'all' | 'region' | 'assigned' | 'organization';

export interface UserAccessScope {
  userId: string;
  roleKey: string;
  roleId: string;
  organizationId: string | null;
  permissions: string[];
  categoryIds: string[];
  categoryKeys: string[];
  geozoneIds: string[];
  mapLayers: string[];
  analyticsKeys: string[];
  incidentScope: IncidentScopeType;
}

export interface UserAccessPayload {
  permissions: string[];
  categories: string[];
  mapLayers: string[];
  analytics: string[];
  incidentScope: IncidentScopeType;
  geozones: string[];
  roleKey: string;
  organization?: { id: string; name: string; type: string } | null;
}

export function scopeToPayload(scope: UserAccessScope, geozoneNames?: string[]): UserAccessPayload {
  return {
    permissions: scope.permissions,
    categories: scope.categoryKeys,
    mapLayers: scope.mapLayers,
    analytics: scope.analyticsKeys,
    incidentScope: scope.incidentScope,
    geozones: geozoneNames ?? scope.geozoneIds,
    roleKey: scope.roleKey,
  };
}

/** Map category keys to map layer keys for filtering */
export const CATEGORY_KEY_TO_LAYER: Record<string, string> = {
  water: 'water_incidents',
  gas: 'gas_incidents',
  electricity: 'electricity_incidents',
  road_surface: 'roads_incidents',
  asphalt_repair: 'roads_incidents',
  broken_lamps: 'lighting_incidents',
  dark_areas: 'lighting_incidents',
  street_dirt: 'sanitation_incidents',
  overflow_bins: 'sanitation_incidents',
  floods: 'floods',
  ice: 'weather_incidents',
  storm_damage: 'weather_incidents',
  dry_zones: 'greenery_incidents',
  tree_fall: 'greenery_incidents',
  mowing: 'greenery_incidents',
};
