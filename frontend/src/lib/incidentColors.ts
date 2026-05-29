import type { IncidentPriority, IncidentStatus } from '@/types';
import { getPriorityStyle, getStatusStyle } from './incidentStyles';

/** @deprecated Use getStatusStyle(status).color */
export function statusColor(status: IncidentStatus): string {
  return getStatusStyle(status).color;
}

/** @deprecated Use getPriorityStyle(priority).color */
export function priorityColor(priority: IncidentPriority): string {
  return getPriorityStyle(priority).color;
}
