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
    color: '#f59e0b',
    mapColor: MAP_STATUS_COLORS.NEW.fill,
    mapBorder: MAP_STATUS_COLORS.NEW.border,
    bg: 'rgba(245, 158, 11, 0.18)',
    border: '#fbbf24',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-new',
    markerClass: 'status-marker-new',
  },
  IN_PROGRESS: {
    label: az.status.IN_PROGRESS,
    color: '#3b82f6',
    mapColor: MAP_STATUS_COLORS.IN_PROGRESS.fill,
    mapBorder: MAP_STATUS_COLORS.IN_PROGRESS.border,
    bg: 'rgba(59, 130, 246, 0.18)',
    border: '#60a5fa',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-in-progress',
    markerClass: 'status-marker-in-progress',
  },
  PENDING: {
    label: az.status.PENDING,
    color: '#a855f7',
    mapColor: MAP_STATUS_COLORS.PENDING.fill,
    mapBorder: MAP_STATUS_COLORS.PENDING.border,
    bg: 'rgba(168, 85, 247, 0.18)',
    border: '#c084fc',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-pending',
    markerClass: 'status-marker-pending',
  },
  RESOLVED: {
    label: az.status.RESOLVED,
    color: '#22c55e',
    mapColor: MAP_STATUS_COLORS.RESOLVED.fill,
    mapBorder: MAP_STATUS_COLORS.RESOLVED.border,
    bg: 'rgba(34, 197, 94, 0.18)',
    border: '#4ade80',
    badgeClass: badgeMuted,
    rowClass: 'incident-row-resolved',
    markerClass: 'status-marker-resolved',
  },
  OVERDUE: {
    label: az.status.OVERDUE,
    color: '#ef4444',
    mapColor: MAP_STATUS_COLORS.OVERDUE.fill,
    mapBorder: MAP_STATUS_COLORS.OVERDUE.border,
    bg: 'rgba(239, 68, 68, 0.22)',
    border: '#f87171',
    badgeClass: `${badgeMuted} border-destructive/30 bg-destructive/10 text-destructive-foreground`,
    rowClass: 'incident-row-overdue',
    markerClass: 'status-marker-overdue',
  },
  ARCHIVED: {
    label: az.status.ARCHIVED,
    color: '#94a3b8',
    mapColor: MAP_STATUS_COLORS.ARCHIVED.fill,
    mapBorder: MAP_STATUS_COLORS.ARCHIVED.border,
    bg: 'rgba(148, 163, 184, 0.12)',
    border: '#64748b',
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
    color: '#ef4444',
    badgeClass:
      'border-destructive/30 bg-destructive/10 text-destructive-foreground font-medium',
  },
  HIGH: {
    label: az.priority.HIGH,
    color: '#f97316',
    badgeClass: badgeMuted,
  },
  MEDIUM: {
    label: az.priority.MEDIUM,
    color: '#eab308',
    badgeClass: badgeMuted,
  },
  LOW: {
    label: az.priority.LOW,
    color: '#22c55e',
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
  const base = `background:${s.mapColor};border:2px solid ${s.mapBorder};box-shadow:0 1px 6px rgba(0,0,0,.55);`;

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
