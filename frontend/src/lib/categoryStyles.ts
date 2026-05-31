import { getStatusStyle } from '@/lib/incidentStyles';
import { MAP_ICONS, buildMapPinMarkerHtml, type MapIconDef } from '@/lib/mapMarkerIcons';

/** Neutral chip on filters/legends — map pin color comes from status, not category. */
export const CATEGORY_LEGEND_CHIP = {
  mapColor: '#64748b',
  mapBorder: '#475569',
} as const;
import type { IncidentStatus } from '@/types';
import type { MapIncidentPin } from '@/lib/mapIncidentPin';
import type { MapIncident } from '@/types';

export interface CategoryStyle {
  mapColor: string;
  mapBorder: string;
  icon: MapIconDef;
  markerClass: string;
}

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  mapColor: '#8c8c8c',
  mapBorder: '#595959',
  icon: MAP_ICONS.blocks,
  markerClass: 'category-marker-default',
};

/** Leaf + parent category keys — icons and colors for map pins and UI. */
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  infrastructure: {
    mapColor: '#597ef7',
    mapBorder: '#2f54eb',
    icon: MAP_ICONS.building,
    markerClass: 'category-marker-infrastructure',
  },
  facades: {
    mapColor: '#597ef7',
    mapBorder: '#2f54eb',
    icon: MAP_ICONS.building,
    markerClass: 'category-marker-facades',
  },
  sidewalks: {
    mapColor: '#8c8c8c',
    mapBorder: '#595959',
    icon: MAP_ICONS.footprints,
    markerClass: 'category-marker-sidewalks',
  },
  curbs: {
    mapColor: '#bfbfbf',
    mapBorder: '#8c8c8c',
    icon: MAP_ICONS.minus,
    markerClass: 'category-marker-curbs',
  },
  road_surface: {
    mapColor: '#595959',
    mapBorder: '#434343',
    icon: MAP_ICONS.construction,
    markerClass: 'category-marker-road',
  },
  asphalt_repair: {
    mapColor: '#434343',
    mapBorder: '#262626',
    icon: MAP_ICONS.hammer,
    markerClass: 'category-marker-asphalt',
  },
  utilities: {
    mapColor: '#13c2c2',
    mapBorder: '#08979c',
    icon: MAP_ICONS.wrench,
    markerClass: 'category-marker-utilities',
  },
  water: {
    mapColor: '#1890ff',
    mapBorder: '#096dd9',
    icon: MAP_ICONS.droplets,
    markerClass: 'category-marker-water',
  },
  gas: {
    mapColor: '#fa8c16',
    mapBorder: '#d46b08',
    icon: MAP_ICONS.flame,
    markerClass: 'category-marker-gas',
  },
  electricity: {
    mapColor: '#faad14',
    mapBorder: '#d48806',
    icon: MAP_ICONS.zap,
    markerClass: 'category-marker-electricity',
  },
  comm_lines: {
    mapColor: '#722ed1',
    mapBorder: '#531dab',
    icon: MAP_ICONS.cable,
    markerClass: 'category-marker-comm',
  },
  greenery: {
    mapColor: '#52c41a',
    mapBorder: '#389e0d',
    icon: MAP_ICONS.trees,
    markerClass: 'category-marker-greenery',
  },
  dry_zones: {
    mapColor: '#a0d911',
    mapBorder: '#7cb305',
    icon: MAP_ICONS.sun,
    markerClass: 'category-marker-dry',
  },
  tree_fall: {
    mapColor: '#389e0d',
    mapBorder: '#237804',
    icon: MAP_ICONS.treeDeciduous,
    markerClass: 'category-marker-tree',
  },
  mowing: {
    mapColor: '#73d13d',
    mapBorder: '#52c41a',
    icon: MAP_ICONS.scissors,
    markerClass: 'category-marker-mowing',
  },
  weather_emergency: {
    mapColor: '#36cfc9',
    mapBorder: '#13a8a8',
    icon: MAP_ICONS.cloudRain,
    markerClass: 'category-marker-weather',
  },
  floods: {
    mapColor: '#1890ff',
    mapBorder: '#0050b3',
    icon: MAP_ICONS.waves,
    markerClass: 'category-marker-floods',
  },
  ice: {
    mapColor: '#69c0ff',
    mapBorder: '#40a9ff',
    icon: MAP_ICONS.snowflake,
    markerClass: 'category-marker-ice',
  },
  storm_damage: {
    mapColor: '#597ef7',
    mapBorder: '#2f54eb',
    icon: MAP_ICONS.wind,
    markerClass: 'category-marker-storm',
  },
  sanitation: {
    mapColor: '#8c6239',
    mapBorder: '#614d2e',
    icon: MAP_ICONS.trash2,
    markerClass: 'category-marker-sanitation',
  },
  street_dirt: {
    mapColor: '#ad6800',
    mapBorder: '#874d00',
    icon: MAP_ICONS.brush,
    markerClass: 'category-marker-street-dirt',
  },
  overflow_bins: {
    mapColor: '#d48806',
    mapBorder: '#ad6800',
    icon: MAP_ICONS.trash2,
    markerClass: 'category-marker-bins',
  },
  lighting: {
    mapColor: '#fadb14',
    mapBorder: '#d4b106',
    icon: MAP_ICONS.lightbulb,
    markerClass: 'category-marker-lighting',
  },
  broken_lamps: {
    mapColor: '#fadb14',
    mapBorder: '#d4b106',
    icon: MAP_ICONS.lamp,
    markerClass: 'category-marker-lamps',
  },
  dark_areas: {
    mapColor: '#9254de',
    mapBorder: '#722ed1',
    icon: MAP_ICONS.moon,
    markerClass: 'category-marker-dark',
  },
  parks: {
    mapColor: '#52c41a',
    mapBorder: '#389e0d',
    icon: MAP_ICONS.trees,
    markerClass: 'category-marker-parks',
  },
  playgrounds: {
    mapColor: '#eb2f96',
    mapBorder: '#c41d7f',
    icon: MAP_ICONS.blocks,
    markerClass: 'category-marker-playground',
  },
  benches: {
    mapColor: '#d48806',
    mapBorder: '#ad6800',
    icon: MAP_ICONS.armchair,
    markerClass: 'category-marker-benches',
  },
  fountains: {
    mapColor: '#36cfc9',
    mapBorder: '#13a8a8',
    icon: MAP_ICONS.fountain,
    markerClass: 'category-marker-fountain',
  },
  advertising: {
    mapColor: '#eb2f96',
    mapBorder: '#c41d7f',
    icon: MAP_ICONS.megaphone,
    markerClass: 'category-marker-advertising',
  },
  billboards: {
    mapColor: '#f759ab',
    mapBorder: '#eb2f96',
    icon: MAP_ICONS.panelTop,
    markerClass: 'category-marker-billboard',
  },
  storefronts: {
    mapColor: '#ff85c0',
    mapBorder: '#f759ab',
    icon: MAP_ICONS.store,
    markerClass: 'category-marker-store',
  },
  fences: {
    mapColor: '#8c8c8c',
    mapBorder: '#595959',
    icon: MAP_ICONS.fence,
    markerClass: 'category-marker-fence',
  },
};

export function getCategoryStyle(categoryKey: string): CategoryStyle {
  return CATEGORY_STYLES[categoryKey] ?? DEFAULT_CATEGORY_STYLE;
}

export function resolveIncidentCategoryKey(incident: {
  category: { key: string };
  subcategory?: { key: string } | null;
}): string {
  return incident.subcategory?.key ?? incident.category.key;
}

export function categoryMarkerHtml(categoryKey: string, size?: number): string {
  const s = getCategoryStyle(categoryKey);
  return buildMapPinMarkerHtml({
    mapColor: s.mapColor,
    mapBorder: s.mapBorder,
    icon: s.icon,
    size: size ?? 30,
    markerClass: `category-marker ${s.markerClass}`,
  });
}

export function categoryMarkerHtmlForIncident(
  incident: MapIncident,
  size?: number,
): string {
  return categoryMarkerHtml(resolveIncidentCategoryKey(incident), size);
}

/** Map pin: category icon inside, status color on the circle. */
export function incidentMapMarkerHtml(incident: {
  status: IncidentStatus;
  category: { key: string };
  subcategory?: { key: string } | null;
}): { html: string; size: number } {
  const categoryKey = resolveIncidentCategoryKey(incident);
  const cat = getCategoryStyle(categoryKey);
  const status = getStatusStyle(incident.status);
  const size =
    incident.status === 'OVERDUE' ? 32 : incident.status === 'ARCHIVED' ? 26 : 30;

  return {
    html: buildMapPinMarkerHtml({
      mapColor: status.mapColor,
      mapBorder: status.mapBorder,
      icon: cat.icon,
      size,
      markerClass: `incident-pin ${cat.markerClass} ${status.markerClass}`,
    }),
    size,
  };
}

export function incidentMapMarkerHtmlForPin(pin: MapIncidentPin): {
  html: string;
  size: number;
} {
  return incidentMapMarkerHtml(pin.incident);
}
