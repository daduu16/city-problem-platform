import { az } from '@/i18n/az';
import { MAP_STATUS_COLORS } from '@/lib/mapPalette';
import type { IncidentPriority, IncidentStatus } from '@/types';

const badgeMuted =
  'border-border/60 bg-secondary/60 text-secondary-foreground font-normal';

export interface StatusStyle {
  label: string;
  /** Table dot, dashboard status chart */
  color: string;
  /** 2D / 3D map markers and map legend */
  mapColor: string;
  mapBorder: string;
  bg: string;
  border: string;
  badgeClass: string;
  rowClass: string;
  markerClass: string;
}

export const STATUS_STYLES: Record<IncidentStatus, StatusStyle> = {
  NEW: {
    label: az.status.NEW,
    color: '#faad14',
    mapColor: MAP_STATUS_COLORS.NEW.fill,
    mapBorder: MAP_STATUS_COLORS.NEW.border,
    bg: 'rgba(250, 173, 20, 0.15)',
    border: '#faad14',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-new',
    markerClass: 'status-marker-new',
  },
  IN_PROGRESS: {
    label: az.status.IN_PROGRESS,
    color: '#5d5fef',
    mapColor: MAP_STATUS_COLORS.IN_PROGRESS.fill,
    mapBorder: MAP_STATUS_COLORS.IN_PROGRESS.border,
    bg: 'rgba(93, 95, 239, 0.12)',
    border: '#5d5fef',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-in-progress',
    markerClass: 'status-marker-in-progress',
  },
  PENDING: {
    label: az.status.PENDING,
    color: '#9254de',
    mapColor: MAP_STATUS_COLORS.PENDING.fill,
    mapBorder: MAP_STATUS_COLORS.PENDING.border,
    bg: 'rgba(146, 84, 222, 0.12)',
    border: '#9254de',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-pending',
    markerClass: 'status-marker-pending',
  },
  RESOLVED: {
    label: az.status.RESOLVED,
    color: '#52c41a',
    mapColor: MAP_STATUS_COLORS.RESOLVED.fill,
    mapBorder: MAP_STATUS_COLORS.RESOLVED.border,
    bg: 'rgba(82, 196, 26, 0.12)',
    border: '#52c41a',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-resolved',
    markerClass: 'status-marker-resolved',
  },
  OVERDUE: {
    label: az.status.OVERDUE,
    color: '#ff4d4f',
    mapColor: MAP_STATUS_COLORS.OVERDUE.fill,
    mapBorder: MAP_STATUS_COLORS.OVERDUE.border,
    bg: 'rgba(255, 77, 79, 0.12)',
    border: '#ff4d4f',
    badgeClass: `${badgeMuted} border-destructive/30 bg-destructive/10 text-destructive`,
    rowClass: 'incident-row-overdue',
    markerClass: 'status-marker-overdue',
  },
  ARCHIVED: {
    label: az.status.ARCHIVED,
    color: '#8c8c8c',
    mapColor: MAP_STATUS_COLORS.ARCHIVED.fill,
    mapBorder: MAP_STATUS_COLORS.ARCHIVED.border,
    bg: 'rgba(140, 140, 140, 0.1)',
    border: '#bfbfbf',
    badgeClass: `${badgeMuted} opacity-70 line-through decoration-muted-foreground`,
    rowClass: 'incident-row-archived',
    markerClass: 'status-marker-archived',
  },
};

export const PRIORITY_STYLES: Record<
  IncidentPriority,
  { label: string; badgeClass: string; color: string }
> = {
  CRITICAL: {
    label: az.priority.CRITICAL,
    color: '#ff4d4f',
    badgeClass:
      'border-destructive/30 bg-destructive/10 text-destructive font-medium',
  },
  HIGH: {
    label: az.priority.HIGH,
    color: '#fa8c16',
    badgeClass: badgeMuted,
  },
  MEDIUM: {
    label: az.priority.MEDIUM,
    color: '#faad14',
    badgeClass: badgeMuted,
  },
  LOW: {
    label: az.priority.LOW,
    color: '#52c41a',
    badgeClass: badgeMuted,
  },
};

export function getStatusStyle(status: IncidentStatus): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES.NEW;
}

export function getPriorityStyle(priority: IncidentPriority) {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM;
}

export const ALL_STATUSES = Object.keys(STATUS_STYLES) as IncidentStatus[];

/** Statuses shown on the active (non-archived) map legend */
export const ACTIVE_MAP_STATUSES = ALL_STATUSES.filter(
  (s) => s !== 'ARCHIVED',
);

/** Marker HTML per status — shape + color distinguish states on the map */
export function statusMarkerHtml(status: IncidentStatus): string {
  const s = getStatusStyle(status);
  const base = `background:${s.mapColor};border:2px solid ${s.mapBorder};box-shadow:0 1px 4px rgba(0,0,0,.2);`;

  switch (status) {
    case 'PENDING':
      return `<span class="status-marker ${s.markerClass}" style="${base}width:12px;height:12px;transform:rotate(45deg);border-radius:2px;display:block;"></span>`;
    case 'ARCHIVED':
      return `<span class="status-marker ${s.markerClass}" style="${base}width:11px;height:11px;border-radius:2px;opacity:.65;display:block;"></span>`;
    case 'RESOLVED':
      return `<span class="status-marker ${s.markerClass}" style="${base}width:13px;height:13px;border-radius:50%;opacity:.85;display:block;"></span>`;
    case 'OVERDUE':
      return `<span class="status-marker ${s.markerClass}" style="${base}width:16px;height:16px;border-radius:50%;display:block;border-width:3px;"></span>`;
    case 'IN_PROGRESS':
      return `<span class="status-marker ${s.markerClass}" style="${base}width:14px;height:14px;border-radius:50%;display:block;border-style:dashed;"></span>`;
    case 'NEW':
    default:
      return `<span class="status-marker ${s.markerClass}" style="${base}width:14px;height:14px;border-radius:50%;display:block;"></span>`;
  }
}
