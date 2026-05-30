import { tCategory, tHistoryAction, tPriority, tRole, tStatus, tType } from '@/i18n/az';
import type { IncidentPriority, IncidentStatus, IncidentType } from '@/types';

export function formatStatus(status: IncidentStatus): string {
  return tStatus(status);
}

export function formatPriority(priority: IncidentPriority): string {
  return tPriority(priority);
}

export function formatCategory(category: string | { key: string; name?: string }): string {
  if (typeof category === 'object') {
    return category.name ?? tCategory(category.key);
  }
  return tCategory(category);
}

export function formatType(type: IncidentType): string {
  return tType(type);
}

export function formatRole(roleKey: string): string {
  return tRole(roleKey);
}

export function formatHistoryAction(action: string): string {
  return tHistoryAction(action);
}

/** Relative time label for dashboard feeds (Azerbaijani). */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'İndi';
  if (minutes < 60) return `${minutes} dəq əvvəl`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün əvvəl`;
  return new Date(iso).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
}
