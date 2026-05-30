import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { az } from '@/i18n/az';
import { ALL_STATUSES, getPriorityStyle, getStatusStyle } from '@/lib/incidentStyles';
import { INCIDENT_CATEGORY_TREE } from '@/lib/categoryTree';
import type { IncidentGridFilterState } from '@/lib/incidentGridFilters';
import type { IncidentPriority } from '@/types';
import {
  CategoryTreeDropdown,
  getSelectCategoryTriggerLabel,
} from '@/components/shared/CategoryTreeDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PRIORITIES: IncidentPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const selectClassName = cn(
  'flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm',
  'text-foreground transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
);

type Props = {
  filters: IncidentGridFilterState;
  onChange: (next: IncidentGridFilterState) => void;
  onReset: () => void;
  shownCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
};

export function IncidentGridFilters({
  filters,
  onChange,
  onReset,
  shownCount,
  totalCount,
  hasActiveFilters,
}: Props) {
  const categoryTriggerLabel = useMemo(
    () =>
      getSelectCategoryTriggerLabel(
        INCIDENT_CATEGORY_TREE,
        filters.categoryKey,
        az.incidents.filterAll,
      ),
    [filters.categoryKey],
  );

  return (
    <div className="space-y-3 border-b border-border/60 bg-card px-4 py-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label htmlFor="incident-search" className="text-xs font-medium text-foreground/80">
            {az.incidents.searchLabel}
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="incident-search"
              type="search"
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              placeholder={az.incidents.searchPlaceholder}
              className="h-9 bg-background pl-9 shadow-sm"
            />
          </div>
        </div>

        <div className="w-full min-w-[140px] space-y-1.5 sm:w-40">
          <Label htmlFor="incident-filter-status" className="text-xs font-medium text-foreground/80">
            {az.incidents.filterStatus}
          </Label>
          <select
            id="incident-filter-status"
            value={filters.status}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as IncidentGridFilterState['status'],
              })
            }
            className={selectClassName}
          >
            <option value="ALL">{az.incidents.filterAll}</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getStatusStyle(status).label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full min-w-[140px] space-y-1.5 sm:w-40">
          <Label htmlFor="incident-filter-priority" className="text-xs font-medium text-foreground/80">
            {az.incidents.filterPriority}
          </Label>
          <select
            id="incident-filter-priority"
            value={filters.priority}
            onChange={(e) =>
              onChange({
                ...filters,
                priority: e.target.value as IncidentGridFilterState['priority'],
              })
            }
            className={selectClassName}
          >
            <option value="ALL">{az.incidents.filterAll}</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityStyle(priority).label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full min-w-[180px] space-y-1.5 sm:w-52">
          <Label className="text-xs font-medium text-foreground/80">
            {az.incidents.filterCategory}
          </Label>
          <CategoryTreeDropdown
            mode="select"
            tree={INCIDENT_CATEGORY_TREE}
            triggerLabel={categoryTriggerLabel}
            searchPlaceholder={az.map.categorySearch}
            emptyMessage={az.map.categorySearchEmpty}
            selectedKey={filters.categoryKey}
            onSelectKey={(key) => onChange({ ...filters, categoryKey: key })}
            allLabel={az.incidents.filterAll}
          />
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-9 shrink-0 gap-1.5 border-border/70 bg-background shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
            {az.incidents.filterReset}
          </Button>
        )}
      </div>

      <p className="text-xs text-foreground/70">
        {az.incidents.filteredCount(shownCount, totalCount)}
      </p>
    </div>
  );
}
