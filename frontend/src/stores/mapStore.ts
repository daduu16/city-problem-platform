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

interface MapState {
  viewMode: MapViewMode;
  showHeatmap: boolean;
  showClusters: boolean;
  layers: Record<MapLayerKey, boolean>;
  selectedIncidentId: string | null;
  setViewMode: (mode: MapViewMode) => void;
  setShowHeatmap: (v: boolean) => void;
  setShowClusters: (v: boolean) => void;
  toggleLayer: (key: MapLayerKey) => void;
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
  viewMode: '2d',
  showHeatmap: false,
  showClusters: true,
  layers: defaultLayers,
  selectedIncidentId: null,
  setViewMode: (viewMode) => set({ viewMode }),
  setShowHeatmap: (showHeatmap) => set({ showHeatmap }),
  setShowClusters: (showClusters) => set({ showClusters }),
  toggleLayer: (key) =>
    set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
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
