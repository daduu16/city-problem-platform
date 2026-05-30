import { getIncidentFilterCategoryKey } from '@/lib/mapIncidentCategory';
import { getPriorityStyle, getStatusStyle } from '@/lib/incidentStyles';
import type { MapIncident } from '@/types';

type MarkerSpec = {
  label: string;
  color: string;
  icon: string;
};

const ICONS = {
  water:
    '<path d="M12 2C9 6.2 6.5 9.1 6.5 12.4a5.5 5.5 0 0 0 11 0C17.5 9.1 15 6.2 12 2Z"/><path d="M9.6 13.1c.4 1.4 1.4 2.2 2.8 2.4"/>',
  flame:
    '<path d="M12.4 2.5c.6 2.9-.7 4.4-2 5.8-1.1 1.2-2.1 2.4-2.1 4.4a3.9 3.9 0 0 0 7.8.1c0-1.7-.8-3.1-2.2-4.4.1 1.2-.3 2.1-1.2 2.7.2-2.1-.6-4.1-2.3-5.9Z"/>',
  bolt:
    '<path d="m13 2-7 11h5l-1 9 8-12h-5z"/>',
  road:
    '<path d="M8 22 10 2h4l2 20"/><path d="M12 6v3m0 4v3m0 4v2"/><path d="M5 22h14"/>',
  trash:
    '<path d="M4 7h16"/><path d="M10 11v6m4-6v6"/><path d="m6 7 1 14h10l1-14"/><path d="M9 7V4h6v3"/>',
  tree:
    '<path d="M12 22v-6"/><path d="M8 16h8l-2-4h2L12 3 8 12h2z"/>',
  lamp:
    '<path d="M9 2h6l2 7H7z"/><path d="M12 9v13"/><path d="M8 22h8"/><path d="M6 13h12"/>',
  storm:
    '<path d="M7 17a5 5 0 0 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 7"/><path d="m13 12-3 5h3l-2 5 5-7h-3z"/>',
  park:
    '<path d="M4 13h16"/><path d="M6 13v7m12-7v7"/><path d="M8 17h8"/><path d="M7 10a5 5 0 0 1 10 0"/>',
  sign:
    '<path d="M5 5h14v8H5z"/><path d="M12 13v9"/><path d="M8 22h8"/>',
  building:
    '<path d="M5 22V3h14v19"/><path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2"/><path d="M10 22v-4h4v4"/>',
  default:
    '<path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z"/><path d="M12 10.5h.01"/>',
} as const;

const CATEGORY_MARKERS: Record<string, MarkerSpec> = {
  water: { label: 'Su', color: '#0ea5e9', icon: ICONS.water },
  floods: { label: 'Su basması', color: '#0284c7', icon: ICONS.water },
  fountains: { label: 'Fontan', color: '#06b6d4', icon: ICONS.water },
  gas: { label: 'Qaz', color: '#f97316', icon: ICONS.flame },
  electricity: { label: 'Elektrik', color: '#eab308', icon: ICONS.bolt },
  comm_lines: { label: 'Kommunikasiya', color: '#6366f1', icon: ICONS.bolt },
  road_surface: { label: 'Yol', color: '#64748b', icon: ICONS.road },
  asphalt_repair: { label: 'Asfalt', color: '#475569', icon: ICONS.road },
  sidewalks: { label: 'Səki', color: '#64748b', icon: ICONS.road },
  curbs: { label: 'Kürsü', color: '#64748b', icon: ICONS.road },
  street_dirt: { label: 'Təmizlik', color: '#22c55e', icon: ICONS.trash },
  overflow_bins: { label: 'Zibil', color: '#16a34a', icon: ICONS.trash },
  greenery: { label: 'Yaşıllıq', color: '#16a34a', icon: ICONS.tree },
  dry_zones: { label: 'Quru zona', color: '#84cc16', icon: ICONS.tree },
  tree_fall: { label: 'Ağac', color: '#15803d', icon: ICONS.tree },
  mowing: { label: 'Ot biçmə', color: '#65a30d', icon: ICONS.tree },
  broken_lamps: { label: 'İşıq', color: '#facc15', icon: ICONS.lamp },
  dark_areas: { label: 'Qaranlıq', color: '#f59e0b', icon: ICONS.lamp },
  weather_emergency: { label: 'Fövqəladə', color: '#ef4444', icon: ICONS.storm },
  storm_damage: { label: 'Tufan', color: '#dc2626', icon: ICONS.storm },
  ice: { label: 'Buz', color: '#60a5fa', icon: ICONS.storm },
  playgrounds: { label: 'Meydança', color: '#a855f7', icon: ICONS.park },
  benches: { label: 'Skameyka', color: '#8b5cf6', icon: ICONS.park },
  billboards: { label: 'Reklam', color: '#ec4899', icon: ICONS.sign },
  storefronts: { label: 'Vitrin', color: '#db2777', icon: ICONS.sign },
  fences: { label: 'Hasar', color: '#be185d', icon: ICONS.sign },
  facades: { label: 'Fasad', color: '#7c3aed', icon: ICONS.building },
};

function markerSpecForIncident(incident: MapIncident): MarkerSpec {
  const leafKey = getIncidentFilterCategoryKey(incident);
  const parentKey = incident.category.key;
  return (
    CATEGORY_MARKERS[leafKey] ??
    CATEGORY_MARKERS[parentKey] ?? {
      label: incident.subcategory?.name ?? incident.category.name,
      color: '#2563eb',
      icon: ICONS.default,
    }
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function incidentCategoryMarkerHtml(incident: MapIncident): string {
  const category = markerSpecForIncident(incident);
  const status = getStatusStyle(incident.status);
  const priority = getPriorityStyle(incident.priority);
  const isUrgent = incident.status === 'OVERDUE' || incident.priority === 'CRITICAL';
  const isActive = incident.status === 'NEW' || incident.status === 'IN_PROGRESS';
  const reportBadge =
    incident.reportCount > 1
      ? `<span class="incident-action-marker__count">${incident.reportCount}</span>`
      : '';
  const classes = [
    'incident-action-marker',
    isUrgent ? 'incident-action-marker--alarm' : '',
    isActive ? 'incident-action-marker--active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <button
      type="button"
      class="${classes}"
      style="--marker-color:${category.color};--status-color:${status.mapColor};--priority-color:${priority.color};"
      title="${escapeHtml(`${category.label}: ${incident.title}`)}"
      aria-label="${escapeHtml(`${category.label}: ${incident.title}`)}"
    >
      <span class="incident-action-marker__ring"></span>
      <span class="incident-action-marker__body">
        <svg viewBox="0 0 24 24" aria-hidden="true">${category.icon}</svg>
      </span>
      ${reportBadge}
    </button>
  `;
}
