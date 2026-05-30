import { darkenForMap, darkenRecord } from '@/lib/mapColorUtils';

/** District boundary highlight — shared with incident clusters */
export const MAP_DISTRICT_COLOR = darkenForMap('#2563eb', 0.48);

/** Incident clusters (2D + 3D) — same hue as district outline */
export const MAP_CLUSTER_COLORS = {
  small: MAP_DISTRICT_COLOR,
  medium: MAP_DISTRICT_COLOR,
  large: MAP_DISTRICT_COLOR,
} as const;

/** Place / institution point stroke on dark basemap */
export const MAP_POINT_STROKE = '#cbd5e1';

const PLACE_TYPE_COLORS_BASE: Record<string, string> = {
  AUTO_REPAIR: '#b45309',
  BANK: '#2563eb',
  CHANNEL: '#0891b2',
  CLOTHING_RETAIL: '#db2777',
  COMMUNICATION_SERVICES: '#0d9488',
  COMMUNITY_CENTER: '#65a30d',
  COURTHOUSE: '#6366f1',
  CUSTOMIZABLE_POINT_1: '#94a3b8',
  CUSTOMIZABLE_POINT_2: '#94a3b8',
  CUSTOMIZABLE_POINT_3: '#94a3b8',
  CUSTOMIZABLE_POINT_4: '#94a3b8',
  CUSTOMIZABLE_POINT_5: '#94a3b8',
  CUSTOMIZABLE_POINT_6: '#94a3b8',
  CUSTOMIZABLE_POINT_7: '#94a3b8',
  DEPARTMENT_STORE: '#c026d3',
  FIRE_DEPT: '#b91c1c',
  FITNESS_CENTER: '#e11d48',
  GAS_STATION: '#78716c',
  GOV_OFFICE: '#4f46e5',
  GROCERY_STORE: '#84cc16',
  HOME_AND_GARDEN_STORE: '#65a30d',
  HOME_FURNISHINGS_STORE: '#a3e635',
  HOSPITAL: '#dc2626',
  HOTEL: '#a855f7',
  KINDERGARTEN: '#22c55e',
  LANDMARK: '#d97706',
  LIBRARY: '#15803d',
  MOSGUE: '#ca8a04',
  PARK: '#059669',
  PARKING: '#a8a29e',
  PHARMACY: '#f43f5e',
  PHONE: '#7c3aed',
  POLICE_STATION: '#1e3a8a',
  POST_OFFICE: '#3730a3',
  REPAIR_SERVICE: '#d97706',
  REST_AREA_TOURIST_INFO: '#2dd4bf',
  RESTAURANT: '#ea580c',
  RESTAURANT_CAFES: '#f97316',
  RESTAURANT_FAST_FOOD: '#fb923c',
  RESTAURANT_TEA: '#fdba74',
  SCENIC_AREA: '#14b8a6',
  SCHOOL: '#16a34a',
  SERVICES_PERSONAL: '#8b5cf6',
  SHOPPING_CENTER: '#ec4899',
  SOFTWARE_RETAIL: '#6366f1',
  SPECIALTY_RETAIL: '#f472b6',
  SPORT_AIRPORT: '#0ea5e9',
  THEME_PARK: '#14b8a6',
  UTILITY: '#475569',
  WINERY: '#be123c',
  ZOO: '#10b981',
};

export const MAP_PLACE_TYPE_COLORS = darkenRecord(PLACE_TYPE_COLORS_BASE, 0.5);
export const MAP_PLACE_TYPE_DEFAULT_COLOR = darkenForMap('#64748b', 0.55);

const BUILDING_TYPE_COLORS_BASE: Record<string, string> = {
  residential: '#5b9bd5',
  commercial: '#e8985a',
  industrial: '#9b8ec4',
  retail: '#f4a261',
  office: '#7eb6e0',
  hotel: '#c77dff',
  school: '#7bc96f',
  hospital: '#ef6b6b',
  religious: '#d4b85a',
  government: '#6c8ebf',
  warehouse: '#a78b71',
  garage: '#9ca3af',
  other: '#6b7280',
};

export const MAP_BUILDING_TYPE_COLORS = darkenRecord(BUILDING_TYPE_COLORS_BASE, 0.5);

/** Status / type markers on map */
export const MAP_STATUS_COLORS = {
  NEW: { fill: '#b45309', border: '#78350f' },
  IN_PROGRESS: { fill: '#1d4ed8', border: '#1e3a8a' },
  PENDING: { fill: '#7e22ce', border: '#581c87' },
  RESOLVED: { fill: '#15803d', border: '#14532d' },
  OVERDUE: { fill: '#b91c1c', border: '#7f1d1d' },
  ARCHIVED: { fill: '#475569', border: '#334155' },
} as const;

export const MAP_TYPE_COLORS = {
  ACCIDENT: { fill: '#b91c1c', border: '#7f1d1d' },
  COMPLAINT: { fill: '#1d4ed8', border: '#1e3a8a' },
  INSPECTION: { fill: '#7e22ce', border: '#581c87' },
  EMERGENCY: { fill: '#c2410c', border: '#7c2d12' },
} as const;
