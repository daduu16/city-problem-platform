/** District boundary highlight — shared with incident clusters */
export const MAP_DISTRICT_COLOR = '#5d5fef';

/** Incident clusters (2D + 3D) — same hue as district outline */
export const MAP_CLUSTER_COLORS = {
  small: MAP_DISTRICT_COLOR,
  medium: MAP_DISTRICT_COLOR,
  large: MAP_DISTRICT_COLOR,
} as const;

/** Place / institution point stroke on light basemap */
export const MAP_POINT_STROKE = '#ffffff';

export const MAP_PLACE_TYPE_COLORS: Record<string, string> = {
  AUTO_REPAIR: '#d48806',
  BANK: '#5d5fef',
  CHANNEL: '#13c2c2',
  CLOTHING_RETAIL: '#eb2f96',
  COMMUNICATION_SERVICES: '#13c2c2',
  COMMUNITY_CENTER: '#52c41a',
  COURTHOUSE: '#5d5fef',
  CUSTOMIZABLE_POINT_1: '#8c8c8c',
  CUSTOMIZABLE_POINT_2: '#8c8c8c',
  CUSTOMIZABLE_POINT_3: '#8c8c8c',
  CUSTOMIZABLE_POINT_4: '#8c8c8c',
  CUSTOMIZABLE_POINT_5: '#8c8c8c',
  CUSTOMIZABLE_POINT_6: '#8c8c8c',
  CUSTOMIZABLE_POINT_7: '#8c8c8c',
  DEPARTMENT_STORE: '#722ed1',
  FIRE_DEPT: '#ff4d4f',
  FITNESS_CENTER: '#eb2f96',
  GAS_STATION: '#8c8c8c',
  GOV_OFFICE: '#5d5fef',
  GROCERY_STORE: '#52c41a',
  HOME_AND_GARDEN_STORE: '#52c41a',
  HOME_FURNISHINGS_STORE: '#73d13d',
  HOSPITAL: '#ff4d4f',
  HOTEL: '#9254de',
  KINDERGARTEN: '#52c41a',
  LANDMARK: '#faad14',
  LIBRARY: '#389e0d',
  MOSGUE: '#faad14',
  PARK: '#52c41a',
  PARKING: '#bfbfbf',
  PHARMACY: '#ff4d4f',
  PHONE: '#722ed1',
  POLICE_STATION: '#2f54eb',
  POST_OFFICE: '#5d5fef',
  REPAIR_SERVICE: '#faad14',
  REST_AREA_TOURIST_INFO: '#13c2c2',
  RESTAURANT: '#fa8c16',
  RESTAURANT_CAFES: '#fa8c16',
  RESTAURANT_FAST_FOOD: '#ffa940',
  RESTAURANT_TEA: '#ffc069',
  SCENIC_AREA: '#13c2c2',
  SCHOOL: '#52c41a',
  SERVICES_PERSONAL: '#9254de',
  SHOPPING_CENTER: '#eb2f96',
  SOFTWARE_RETAIL: '#5d5fef',
  SPECIALTY_RETAIL: '#f759ab',
  SPORT_AIRPORT: '#1890ff',
  THEME_PARK: '#13c2c2',
  UTILITY: '#595959',
  WINERY: '#ff4d4f',
  ZOO: '#52c41a',
};

export const MAP_PLACE_TYPE_DEFAULT_COLOR = '#8c8c8c';

export const MAP_BUILDING_TYPE_COLORS: Record<string, string> = {
  residential: '#69b1ff',
  commercial: '#ffa940',
  industrial: '#b37feb',
  retail: '#ffc069',
  office: '#85a5ff',
  hotel: '#d3adf7',
  school: '#95de64',
  hospital: '#ff7875',
  religious: '#ffd666',
  government: '#597ef7',
  warehouse: '#d9b08c',
  garage: '#bfbfbf',
  other: '#8c8c8c',
};

/** Status / type markers on map — SmartRayon gamma */
export const MAP_STATUS_COLORS = {
  NEW: { fill: '#faad14', border: '#d48806' },
  IN_PROGRESS: { fill: '#5d5fef', border: '#4345c9' },
  PENDING: { fill: '#9254de', border: '#722ed1' },
  RESOLVED: { fill: '#52c41a', border: '#389e0d' },
  OVERDUE: { fill: '#ff4d4f', border: '#cf1322' },
  ARCHIVED: { fill: '#bfbfbf', border: '#8c8c8c' },
} as const;

export const MAP_TYPE_COLORS = {
  ACCIDENT: { fill: '#ff4d4f', border: '#cf1322' },
  COMPLAINT: { fill: '#5d5fef', border: '#4345c9' },
  INSPECTION: { fill: '#9254de', border: '#722ed1' },
  EMERGENCY: { fill: '#fa8c16', border: '#d46b08' },
} as const;
