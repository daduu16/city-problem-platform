import { az } from '@/i18n/az';
import { MAP_TYPE_COLORS } from '@/lib/mapPalette';
import { MAP_ICONS, buildMapPinMarkerHtml } from '@/lib/mapMarkerIcons';
import type { IncidentType } from '@/types';

export interface TypeStyle {
  label: string;
  color: string;
  mapColor: string;
  mapBorder: string;
  border: string;
  markerClass: string;
  icon: (typeof MAP_ICONS)[keyof typeof MAP_ICONS];
}

export const TYPE_STYLES: Record<IncidentType, TypeStyle> = {
  ACCIDENT: {
    label: az.type.ACCIDENT,
    color: '#ef4444',
    mapColor: MAP_TYPE_COLORS.ACCIDENT.fill,
    mapBorder: MAP_TYPE_COLORS.ACCIDENT.border,
    border: '#f87171',
    markerClass: 'type-marker-accident',
    icon: MAP_ICONS.alertTriangle,
  },
  COMPLAINT: {
    label: az.type.COMPLAINT,
    color: '#3b82f6',
    mapColor: MAP_TYPE_COLORS.COMPLAINT.fill,
    mapBorder: MAP_TYPE_COLORS.COMPLAINT.border,
    border: '#60a5fa',
    markerClass: 'type-marker-complaint',
    icon: MAP_ICONS.messageCircle,
  },
  INSPECTION: {
    label: az.type.INSPECTION,
    color: '#a855f7',
    mapColor: MAP_TYPE_COLORS.INSPECTION.fill,
    mapBorder: MAP_TYPE_COLORS.INSPECTION.border,
    border: '#c084fc',
    markerClass: 'type-marker-inspection',
    icon: MAP_ICONS.clipboardCheck,
  },
  EMERGENCY: {
    label: az.type.EMERGENCY,
    color: '#f97316',
    mapColor: MAP_TYPE_COLORS.EMERGENCY.fill,
    mapBorder: MAP_TYPE_COLORS.EMERGENCY.border,
    border: '#fb923c',
    markerClass: 'type-marker-emergency',
    icon: MAP_ICONS.siren,
  },
};

export const ALL_INCIDENT_TYPES = Object.keys(TYPE_STYLES) as IncidentType[];

export function getTypeStyle(type: IncidentType): TypeStyle {
  return TYPE_STYLES[type] ?? TYPE_STYLES.COMPLAINT;
}

export function typeMarkerHtml(type: IncidentType): string {
  const s = getTypeStyle(type);
  const size = type === 'EMERGENCY' ? 32 : 30;
  return buildMapPinMarkerHtml({
    mapColor: s.mapColor,
    mapBorder: s.mapBorder,
    icon: s.icon,
    size,
    markerClass: `type-marker ${s.markerClass}`,
  });
}
