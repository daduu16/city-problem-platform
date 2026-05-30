import { formatHistoryAction, formatStatus } from '@/lib/format';
import type { IncidentStatus } from '@/types';

const STATUS_VALUES = new Set<string>([
  'NEW',
  'IN_PROGRESS',
  'PENDING',
  'RESOLVED',
  'OVERDUE',
  'ARCHIVED',
]);

function formatMaybeStatus(value: string | null | undefined): string {
  if (!value) return '';
  if (STATUS_VALUES.has(value)) {
    return formatStatus(value as IncidentStatus);
  }
  return value;
}

export function formatHistoryDetail(
  actionType: string,
  oldValue?: string | null,
  newValue?: string | null,
): string | null {
  if (actionType === 'COMMENT' || actionType === 'CITIZEN_REPORT') {
    return newValue?.trim() || null;
  }
  if (actionType === 'STATUS_CHANGED') {
    const from = formatMaybeStatus(oldValue);
    const to = formatMaybeStatus(newValue);
    if (from && to) return `${from} → ${to}`;
    return to || from || null;
  }
  if (actionType === 'CREATED' && newValue) {
    return formatMaybeStatus(newValue);
  }
  if (newValue) return formatMaybeStatus(newValue);
  if (oldValue) return formatMaybeStatus(oldValue);
  return null;
}

export function formatHistoryTitle(actionType: string): string {
  return formatHistoryAction(actionType);
}
