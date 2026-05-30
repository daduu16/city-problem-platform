import { useMemo } from 'react';
import type { IncidentPriority, IncidentStatus, MapIncident } from '@/types';
import { getIncidentFilterCategoryKey } from '@/lib/mapIncidentCategory';

export type IncidentGridFilterState = {
  query: string;
  status: IncidentStatus | 'ALL';
  priority: IncidentPriority | 'ALL';
  categoryKey: string | 'ALL';
};

export const EMPTY_INCIDENT_GRID_FILTERS: IncidentGridFilterState = {
  query: '',
  status: 'ALL',
  priority: 'ALL',
  categoryKey: 'ALL',
};

export function hasActiveIncidentGridFilters(
  filters: IncidentGridFilterState,
): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.categoryKey !== 'ALL'
  );
}

export function filterIncidentsForGrid(
  rows: MapIncident[],
  filters: IncidentGridFilterState,
): MapIncident[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    const incidentKey = getIncidentFilterCategoryKey(row);
    if (filters.status !== 'ALL' && row.status !== filters.status) return false;
    if (filters.priority !== 'ALL' && row.priority !== filters.priority) return false;
    if (filters.categoryKey !== 'ALL' && incidentKey !== filters.categoryKey) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      row.title,
      row.address ?? '',
      row.category.name,
      row.subcategory?.name ?? '',
      incidentKey,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function useFilteredIncidents(
  rows: MapIncident[],
  filters: IncidentGridFilterState,
) {
  return useMemo(
    () => filterIncidentsForGrid(rows, filters),
    [rows, filters],
  );
}
