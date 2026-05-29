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
