import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/isSuperAdmin';
import type { User, UserAccess } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  access: UserAccess | null;
  setAuth: (token: string, user: User, access: UserAccess) => void;
  setAccess: (access: UserAccess) => void;
  logout: () => void;
  can: (permission: string) => boolean;
  hasCategory: (key: string) => boolean;
  hasMapLayer: (layerKey: string) => boolean;
  hasAnalytics: (key: string) => boolean;
}

const emptyAccess: UserAccess = {
  permissions: [],
  categories: [],
  mapLayers: [],
  analytics: [],
  incidentScope: 'all',
  geozones: [],
  roleKey: '',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      access: null,
      setAuth: (token, user, access) => set({ token, user, access }),
      setAccess: (access) => set({ access }),
      logout: () => set({ token: null, user: null, access: null }),
      can: (permission) => {
        const { access, user } = get();
        const scope = access ?? emptyAccess;
        if (checkSuperAdmin(scope, user)) return true;
        return scope.permissions.includes(permission);
      },
      hasCategory: (key) => {
        const { access, user } = get();
        const scope = access ?? emptyAccess;
        if (checkSuperAdmin(scope, user)) return true;
        if (scope.categories.includes('*')) return true;
        return scope.categories.includes(key);
      },
      hasMapLayer: (layerKey) => {
        const { access, user } = get();
        const scope = access ?? emptyAccess;
        if (checkSuperAdmin(scope, user)) return true;
        if (scope.mapLayers.includes('*')) return true;
        return scope.mapLayers.includes(layerKey);
      },
      hasAnalytics: (key) => {
        const { access, user } = get();
        const scope = access ?? emptyAccess;
        if (checkSuperAdmin(scope, user)) return true;
        if (scope.analytics.includes('*')) return true;
        return scope.analytics.includes(key);
      },
    }),
    { name: 'municipal-auth' },
  ),
);

/** Frontend map layer key → backend map layer access key */
export const MAP_LAYER_TO_ACCESS: Record<string, string> = {
  water: 'water_incidents',
  gas: 'gas_incidents',
  electricity: 'electricity_incidents',
  roads: 'roads_incidents',
  lighting: 'lighting_incidents',
  sanitation: 'sanitation_incidents',
  weather: 'weather_incidents',
  floods: 'floods',
  greenery: 'greenery_incidents',
};
