import { az } from '@/i18n/az';
import type { IncidentPriority, IncidentStatus } from '@/types';

export interface StatusStyle {
  label: string;
  color: string;
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
    bg: 'rgba(245, 158, 11, 0.18)',
    border: '#fbbf24',
    badgeClass:
      'bg-amber-500/20 text-amber-300 border-amber-400/60 ring-1 ring-amber-400/30',
    rowClass: 'incident-row-new',
    markerClass: 'status-marker-new',
  },
  IN_PROGRESS: {
    label: az.status.IN_PROGRESS,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.18)',
    border: '#60a5fa',
    badgeClass:
      'bg-blue-500/20 text-blue-300 border-blue-400/60 ring-1 ring-blue-400/40',
    rowClass: 'incident-row-in-progress',
    markerClass: 'status-marker-in-progress',
  },
  PENDING: {
    label: az.status.PENDING,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.18)',
    border: '#c084fc',
    badgeClass:
      'bg-violet-500/20 text-violet-300 border-violet-400/60 ring-1 ring-violet-400/30',
    rowClass: 'incident-row-pending',
    markerClass: 'status-marker-pending',
  },
  RESOLVED: {
    label: az.status.RESOLVED,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.18)',
    border: '#4ade80',
    badgeClass:
      'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 ring-1 ring-emerald-400/30',
    rowClass: 'incident-row-resolved',
    markerClass: 'status-marker-resolved',
  },
  OVERDUE: {
    label: az.status.OVERDUE,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.22)',
    border: '#f87171',
    badgeClass:
      'bg-red-500/25 text-red-300 border-red-400/70 ring-2 ring-red-500/50 font-semibold',
    rowClass: 'incident-row-overdue',
    markerClass: 'status-marker-overdue',
  },
  ARCHIVED: {
    label: az.status.ARCHIVED,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: '#64748b',
    badgeClass:
      'bg-slate-500/15 text-slate-400 border-slate-500/50 line-through decoration-slate-500',
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
    badgeClass: 'bg-red-600/30 text-red-200 border-red-500/70 font-semibold',
  },
  HIGH: {
    label: az.priority.HIGH,
    color: '#f97316',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
  },
  MEDIUM: {
    label: az.priority.MEDIUM,
    color: '#eab308',
    badgeClass: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/40',
  },
  LOW: {
    label: az.priority.LOW,
    color: '#22c55e',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
};

export function getStatusStyle(status: IncidentStatus): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES.NEW;
}

export function getPriorityStyle(priority: IncidentPriority) {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM;
}

export const ALL_STATUSES = Object.keys(STATUS_STYLES) as IncidentStatus[];

/** Marker HTML per status — shape + color distinguish states on the map */
export function statusMarkerHtml(status: IncidentStatus): string {
  const s = getStatusStyle(status);
  const base = `background:${s.color};border:2px solid ${s.border};box-shadow:0 1px 6px rgba(0,0,0,.5);`;

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
