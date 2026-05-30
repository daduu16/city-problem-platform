import { create } from 'zustand';
import { ACTIVE_MAP_STATUSES } from '@/lib/incidentStyles';
import { canViewCategoryWithAllowed } from '@/lib/mapCategories';
import { MAP_LEAF_CATEGORY_KEYS } from '@/lib/mapCategoryTree';
import type { DistrictZoneId } from '@/lib/narimanovZones';
import { MAP_LAYER_TO_ACCESS } from '@/stores/authStore';
import type { IncidentStatus } from '@/types';

const DISTRICT_ZONE_IDS: DistrictZoneId[] = ['A', 'B', 'C', 'D'];

const defaultVisibleZones = Object.fromEntries(
	DISTRICT_ZONE_IDS.map((id) => [id, true]),
) as Record<DistrictZoneId, boolean>;

export type MapLayerKey =
  | 'water'
  | 'gas'
  | 'electricity'
  | 'roads'
  | 'lighting'
  | 'sanitation'
  | 'weather'
  | 'floods'
  | 'greenery';

export type MapViewMode = '2d' | '3d';

export type IncidentMarkerMode = 'status' | 'type';

export type IncidentCreateMode = false | 'pick' | 'form';

export type IncidentCreateLocation = {
  lat: number;
  lng: number;
};

interface MapState {
  viewMode: MapViewMode;
  showHeatmap: boolean;
  showClusters: boolean;
  showPlaces: boolean;
  visiblePlaceTypes: Record<string, boolean>;
  layers: Record<MapLayerKey, boolean>;
  visibleCategories: Record<string, boolean>;
  visibleStatuses: Record<IncidentStatus, boolean>;
  /** Narimanov sub-zones A–D; hidden zones hide their incidents and map overlay. */
  visibleZones: Record<DistrictZoneId, boolean>;
  /** Plan (flat) vs pitched 3D camera — only when viewMode is 3d. */
  map3dFlatView: boolean;
  mapDateFrom: string | null;
  mapDateTo: string | null;
  selectedIncidentId: string | null;
  incidentCreateMode: IncidentCreateMode;
  incidentCreateLocation: IncidentCreateLocation | null;
  setViewMode: (mode: MapViewMode) => void;
  setShowHeatmap: (v: boolean) => void;
  setShowClusters: (v: boolean) => void;
  setShowPlaces: (v: boolean) => void;
  togglePlaceType: (type: string) => void;
  initPlaceTypes: (types: string[]) => void;
  toggleLayer: (key: MapLayerKey) => void;
  toggleCategory: (categoryKey: string) => void;
  toggleStatus: (status: IncidentStatus) => void;
  toggleZone: (zoneId: DistrictZoneId) => void;
  toggleMap3dFlatView: () => void;
  setMapDateFrom: (value: string | null) => void;
  setMapDateTo: (value: string | null) => void;
  clearMapDateRange: () => void;
  setSelectedIncidentId: (id: string | null) => void;
  openIncident: (id: string) => void;
  startIncidentCreate: () => void;
  cancelIncidentCreate: () => void;
  setIncidentCreateLocation: (lat: number, lng: number) => void;
  reopenIncidentCreatePicker: () => void;
  initLayersFromAccess: (allowedLayerKeys: string[]) => void;
  initCategoriesFromAccess: (allowedLayerKeys: string[]) => void;
  syncCategoryFiltersFromIncidents: (
    categoryKeys: string[],
    allowedLayerKeys: string[],
  ) => void;
}

const defaultLayers: Record<MapLayerKey, boolean> = {
  water: true,
  gas: true,
  electricity: true,
  roads: true,
  lighting: true,
  sanitation: true,
  weather: false,
  floods: true,
  greenery: true,
};

export const useMapStore = create<MapState>((set) => ({
  viewMode: '2d',
  showHeatmap: false,
  showClusters: true,
  showPlaces: false,
  visiblePlaceTypes: {},
  layers: defaultLayers,
  visibleCategories: Object.fromEntries(
    MAP_LEAF_CATEGORY_KEYS.map((k) => [k, true]),
  ),
  visibleStatuses: Object.fromEntries(
    ACTIVE_MAP_STATUSES.map((s) => [s, true]),
  ) as Record<IncidentStatus, boolean>,
  visibleZones: { ...defaultVisibleZones },
  map3dFlatView: false,
  mapDateFrom: null,
  mapDateTo: null,
  selectedIncidentId: null,
  incidentCreateMode: false,
  incidentCreateLocation: null,
  setViewMode: (viewMode) => set({ viewMode }),
  setShowHeatmap: (showHeatmap) => set({ showHeatmap }),
  setShowClusters: (showClusters) => set({ showClusters }),
  setShowPlaces: (showPlaces) => set({ showPlaces }),
  togglePlaceType: (type) =>
    set((s) => {
      const current = s.visiblePlaceTypes[type] !== false;
      return {
        visiblePlaceTypes: {
          ...s.visiblePlaceTypes,
          [type]: !current,
        },
      };
    }),
  initPlaceTypes: (types) =>
    set((s) => {
      const next = { ...s.visiblePlaceTypes };
      for (const type of types) {
        if (!(type in next)) next[type] = true;
      }
      return { visiblePlaceTypes: next };
    }),
  toggleLayer: (key) =>
    set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  toggleCategory: (categoryKey) =>
    set((s) => ({
      visibleCategories: {
        ...s.visibleCategories,
        [categoryKey]: s.visibleCategories[categoryKey] !== true,
      },
    })),
  toggleStatus: (status) =>
    set((s) => ({
      visibleStatuses: {
        ...s.visibleStatuses,
        [status]: s.visibleStatuses[status] !== true,
      },
    })),
  toggleZone: (zoneId) =>
    set((s) => ({
      visibleZones: {
        ...s.visibleZones,
        [zoneId]: s.visibleZones[zoneId] !== true,
      },
    })),
  toggleMap3dFlatView: () =>
    set((s) => ({ map3dFlatView: !s.map3dFlatView })),
  setMapDateFrom: (mapDateFrom) => set({ mapDateFrom }),
  setMapDateTo: (mapDateTo) => set({ mapDateTo }),
  clearMapDateRange: () => set({ mapDateFrom: null, mapDateTo: null }),
  setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
  openIncident: (id) => set({ selectedIncidentId: id }),
  startIncidentCreate: () =>
    set({
      selectedIncidentId: null,
      incidentCreateMode: 'pick',
      incidentCreateLocation: null,
    }),
  cancelIncidentCreate: () =>
    set({ incidentCreateMode: false, incidentCreateLocation: null }),
  setIncidentCreateLocation: (lat, lng) =>
    set({
      incidentCreateMode: 'form',
      incidentCreateLocation: { lat, lng },
    }),
  reopenIncidentCreatePicker: () =>
    set({ incidentCreateMode: 'pick', incidentCreateLocation: null }),
  initLayersFromAccess: (allowed) => {
    if (allowed.includes('*')) return;
    const next = { ...defaultLayers };
    for (const key of Object.keys(next) as MapLayerKey[]) {
      const accessKey = MAP_LAYER_TO_ACCESS[key];
      next[key] = accessKey ? allowed.includes(accessKey) : false;
    }
    set({ layers: next });
  },
  initCategoriesFromAccess: (allowed) => {
    set((s) => {
      const next = { ...s.visibleCategories };
      for (const key of MAP_LEAF_CATEGORY_KEYS) {
        next[key] = canViewCategoryWithAllowed(key, allowed);
      }
      return { visibleCategories: next };
    });
  },
  syncCategoryFiltersFromIncidents: (categoryKeys, allowed) => {
    set((s) => {
      const next = { ...s.visibleCategories };
      for (const key of categoryKeys) {
        if (!(key in next)) {
          next[key] = canViewCategoryWithAllowed(key, allowed);
        }
      }
      return { visibleCategories: next };
    });
  },
}));
