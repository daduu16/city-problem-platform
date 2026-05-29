import { create } from 'zustand';
import { MAP_LAYER_TO_ACCESS } from '@/stores/authStore';

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

interface MapState {
  viewMode: MapViewMode;
  showHeatmap: boolean;
  showClusters: boolean;
  showPlaces: boolean;
  visiblePlaceTypes: Record<string, boolean>;
  layers: Record<MapLayerKey, boolean>;
  mapDateFrom: string | null;
  mapDateTo: string | null;
  selectedIncidentId: string | null;
  setViewMode: (mode: MapViewMode) => void;
  setShowHeatmap: (v: boolean) => void;
  setShowClusters: (v: boolean) => void;
  setShowPlaces: (v: boolean) => void;
  togglePlaceType: (type: string) => void;
  initPlaceTypes: (types: string[]) => void;
  toggleLayer: (key: MapLayerKey) => void;
  setMapDateFrom: (value: string | null) => void;
  setMapDateTo: (value: string | null) => void;
  clearMapDateRange: () => void;
  setSelectedIncidentId: (id: string | null) => void;
  initLayersFromAccess: (allowedLayerKeys: string[]) => void;
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
  viewMode: '3d',
  showHeatmap: false,
  showClusters: false,
  showPlaces: true,
  visiblePlaceTypes: {},
  layers: defaultLayers,
  mapDateFrom: null,
  mapDateTo: null,
  selectedIncidentId: null,
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
  setMapDateFrom: (mapDateFrom) => set({ mapDateFrom }),
  setMapDateTo: (mapDateTo) => set({ mapDateTo }),
  clearMapDateRange: () => set({ mapDateFrom: null, mapDateTo: null }),
  setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
  initLayersFromAccess: (allowed) => {
    if (allowed.includes('*')) return;
    const next = { ...defaultLayers };
    for (const key of Object.keys(next) as MapLayerKey[]) {
      const accessKey = MAP_LAYER_TO_ACCESS[key];
      next[key] = accessKey ? allowed.includes(accessKey) : false;
    }
    set({ layers: next });
  },
}));
