import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { az } from '@/i18n/az';
import type {
  AssigneeAvailabilityCandidate,
  AssigneeAvailabilityResult,
  CategoryAssignee,
} from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBakuDateTime } from '@/lib/baku-date';
import { cn } from '@/lib/utils';

export type AssigneePickerMode = 'timeFirst' | 'assigneeFirst';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AssigneePickerMode;
  categoryId: string;
  startsAt: string;
  endsAt: string;
  selectedId: string | null;
  onSelect: (assignee: CategoryAssignee) => void;
};

function statusLabel(status: AssigneeAvailabilityCandidate['availabilityStatus']) {
  switch (status) {
    case 'available':
      return az.tasks.statusAvailable;
    case 'busy':
      return az.tasks.statusBusy;
    case 'unavailable_block':
      return az.tasks.statusUnavailable;
    case 'outside_hours':
    default:
      return az.tasks.statusOutsideHours;
  }
}

function statusBadgeClass(status: AssigneeAvailabilityCandidate['availabilityStatus']) {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    case 'busy':
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
    case 'unavailable_block':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
    case 'outside_hours':
    default:
      return 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
}

function CandidateRow({
  row,
  selected,
  selectable,
  onClick,
}: {
  row: AssigneeAvailabilityCandidate;
  selected: boolean;
  selectable: boolean;
  onClick: () => void;
}) {
  const firstConflict = row.conflicts?.[0];

  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={onClick}
      className={cn(
        'w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors',
        selected && 'border-primary bg-primary/10',
        !selected && selectable && 'border-border hover:bg-muted/50',
        !selectable && 'cursor-not-allowed border-dashed opacity-70',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground">{row.name}</span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            statusBadgeClass(row.availabilityStatus),
          )}
        >
          {statusLabel(row.availabilityStatus)}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">
        {row.kind === 'TEAM' ? az.executors.kindTeam : az.executors.kindPerson}
        {row.organization ? ` · ${row.organization.name}` : ''}
      </span>
      {firstConflict && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {firstConflict.title}:{' '}
          {formatBakuDateTime(new Date(firstConflict.startsAt))}
          {' — '}
          {formatBakuDateTime(new Date(firstConflict.endsAt))}
          {row.conflicts && row.conflicts.length > 1
            ? ` (+${row.conflicts.length - 1})`
            : ''}
        </p>
      )}
      {row.availabilityStatus === 'outside_hours' && (
        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
          {az.tasks.outsideHoursHint}
        </p>
      )}
    </button>
  );
}

export function AssigneePickerModal({
  open,
  onOpenChange,
  mode,
  categoryId,
  startsAt,
  endsAt,
  selectedId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(t);
  }, [search, open]);

  const rangeValid = Boolean(startsAt && endsAt && new Date(endsAt) > new Date(startsAt));

  const availabilityQuery = useQuery({
    queryKey: [
      'incident-tasks',
      'availability',
      categoryId,
      startsAt,
      endsAt,
      debouncedSearch,
    ],
    queryFn: async () => {
      const res = await api.get<AssigneeAvailabilityResult>(
        '/incident-tasks/availability',
        {
          params: {
            categoryId,
            startsAt,
            endsAt,
            search: debouncedSearch.trim() || undefined,
          },
        },
      );
      return res.data;
    },
    enabled: open && mode === 'timeFirst' && rangeValid,
  });

  const categoryAssigneesQuery = useQuery({
    queryKey: ['incident-tasks', 'category-assignees', categoryId, debouncedSearch],
    queryFn: async () => {
      const res = await api.get<CategoryAssignee[]>(
        '/incident-tasks/category-assignees',
        {
          params: {
            categoryId,
            search: debouncedSearch.trim() || undefined,
          },
        },
      );
      return res.data;
    },
    enabled: open && mode === 'assigneeFirst',
  });

  const timeFirstRows = useMemo(() => {
    const data = availabilityQuery.data;
    if (!data) return [];
    if (data.candidates?.length) return data.candidates;
    const rows: AssigneeAvailabilityCandidate[] = [];
    for (const a of data.available) {
      rows.push({
        id: a.id,
        name: a.name,
        kind: a.kind,
        organization: a.organization,
        availabilityStatus: 'available',
      });
    }
    for (const b of data.busy) {
      rows.push({
        id: b.id,
        name: b.name,
        kind: b.kind,
        organization: b.organization,
        availabilityStatus: 'busy',
        conflicts: b.conflicts,
      });
    }
    for (const o of data.outsideAvailability) {
      rows.push({
        id: o.id,
        name: o.name,
        kind: o.kind,
        organization: o.organization,
        availabilityStatus:
          o.reason === 'unavailable_block' ? 'unavailable_block' : 'outside_hours',
        reason: o.reason,
      });
    }
    return rows;
  }, [availabilityQuery.data]);

  const isLoading =
    mode === 'timeFirst'
      ? availabilityQuery.isFetching
      : categoryAssigneesQuery.isLoading;

  const description =
    mode === 'timeFirst'
      ? az.tasks.pickerDescTimeFirst
      : az.tasks.pickerDescAssigneeFirst;

  const pickAssignee = (assignee: CategoryAssignee) => {
    onSelect(assignee);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{az.tasks.pickerTitle}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="picker-search" className="text-xs">
              {az.tasks.searchExecutor}
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="picker-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={az.tasks.searchPlaceholder}
                className="pl-9"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">{az.tasks.searchHint}</p>
          </div>

          {mode === 'timeFirst' && !rangeValid && (
            <p className="text-sm text-destructive">{az.tasks.invalidRange}</p>
          )}

          {mode === 'timeFirst' && rangeValid && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void availabilityQuery.refetch()}
              disabled={availabilityQuery.isFetching}
            >
              {availabilityQuery.isFetching
                ? az.tasks.searching
                : az.tasks.refreshAvailability}
            </Button>
          )}

          <div className="max-h-[min(40vh,320px)] space-y-2 overflow-y-auto pr-1">
            {isLoading && (
              <p className="text-sm text-muted-foreground">{az.tasks.searching}</p>
            )}

            {mode === 'timeFirst' && timeFirstRows.length > 0 && !isLoading && (
              <ul className="space-y-2">
                {timeFirstRows.map((row) => (
                  <li key={row.id}>
                    <CandidateRow
                      row={row}
                      selected={selectedId === row.id}
                      selectable={row.availabilityStatus === 'available'}
                      onClick={() => {
                        const found = availabilityQuery.data?.available.find(
                          (a) => a.id === row.id,
                        );
                        if (found) pickAssignee(found);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}

            {mode === 'timeFirst' &&
              availabilityQuery.data &&
              timeFirstRows.length === 0 &&
              !isLoading && (
                <p className="text-sm text-muted-foreground">{az.tasks.noAvailable}</p>
              )}

            {mode === 'assigneeFirst' &&
              categoryAssigneesQuery.data &&
              !isLoading && (
                <>
                  {categoryAssigneesQuery.data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {az.tasks.noExecutorsFound}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {categoryAssigneesQuery.data.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => pickAssignee(a)}
                            className={cn(
                              'w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors',
                              selectedId === a.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-muted/50',
                            )}
                          >
                            <span className="font-medium">{a.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {a.kind === 'TEAM'
                                ? az.executors.kindTeam
                                : az.executors.kindPerson}
                            </span>
                            {a.organization && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {a.organization.name}
                              </p>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
