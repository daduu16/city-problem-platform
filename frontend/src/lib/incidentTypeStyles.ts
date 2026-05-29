import { az } from '@/i18n/az';
import { MAP_TYPE_COLORS } from '@/lib/mapPalette';
import type { IncidentType } from '@/types';

export interface TypeStyle {
  label: string;
  color: string;
  mapColor: string;
  mapBorder: string;
  border: string;
  markerClass: string;
}

export const TYPE_STYLES: Record<IncidentType, TypeStyle> = {
  ACCIDENT: {
    label: az.type.ACCIDENT,
    color: '#ef4444',
    mapColor: MAP_TYPE_COLORS.ACCIDENT.fill,
    mapBorder: MAP_TYPE_COLORS.ACCIDENT.border,
    border: '#f87171',
    markerClass: 'type-marker-accident',
  },
  COMPLAINT: {
    label: az.type.COMPLAINT,
    color: '#3b82f6',
    mapColor: MAP_TYPE_COLORS.COMPLAINT.fill,
    mapBorder: MAP_TYPE_COLORS.COMPLAINT.border,
    border: '#60a5fa',
    markerClass: 'type-marker-complaint',
  },
  INSPECTION: {
    label: az.type.INSPECTION,
    color: '#a855f7',
    mapColor: MAP_TYPE_COLORS.INSPECTION.fill,
    mapBorder: MAP_TYPE_COLORS.INSPECTION.border,
    border: '#c084fc',
    markerClass: 'type-marker-inspection',
  },
  EMERGENCY: {
    label: az.type.EMERGENCY,
    color: '#f97316',
    mapColor: MAP_TYPE_COLORS.EMERGENCY.fill,
    mapBorder: MAP_TYPE_COLORS.EMERGENCY.border,
    border: '#fb923c',
    markerClass: 'type-marker-emergency',
  },
};

export const ALL_INCIDENT_TYPES = Object.keys(TYPE_STYLES) as IncidentType[];

export function getTypeStyle(type: IncidentType): TypeStyle {
  return TYPE_STYLES[type] ?? TYPE_STYLES.COMPLAINT;
}

export function typeMarkerHtml(type: IncidentType): string {
  const s = getTypeStyle(type);
  const base = `background:${s.mapColor};border:2px solid ${s.mapBorder};box-shadow:0 1px 6px rgba(0,0,0,.55);`;

  switch (type) {
    case 'EMERGENCY':
      return `<span class="type-marker ${s.markerClass}" style="${base}width:16px;height:16px;border-radius:50%;border-width:3px;display:block;"></span>`;
    case 'INSPECTION':
      return `<span class="type-marker ${s.markerClass}" style="${base}width:12px;height:12px;transform:rotate(45deg);border-radius:2px;display:block;"></span>`;
    case 'ACCIDENT':
      return `<span class="type-marker ${s.markerClass}" style="${base}width:14px;height:14px;border-radius:2px;display:block;"></span>`;
    case 'COMPLAINT':
    default:
      return `<span class="type-marker ${s.markerClass}" style="${base}width:14px;height:14px;border-radius:50%;display:block;"></span>`;
  }
}
