import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { ScheduleTaskView } from '@/types';
import { az } from '@/i18n/az';
import { formatBakuDate, formatBakuTime } from '@/lib/baku-date';
import { PriorityBadge } from '@/components/incidents/PriorityBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Props = {
  tasks: ScheduleTaskView[];
  onRowClick: (task: ScheduleTaskView) => void;
};

function TaskStatusBadge({ status }: { status: string }) {
  const label =
    status in az.schedule.taskStatus
      ? az.schedule.taskStatus[status as keyof typeof az.schedule.taskStatus]
      : status;
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {label}
    </Badge>
  );
}

function StatusCell(params: ICellRendererParams<ScheduleTaskView>) {
  if (!params.data) return null;
  return <TaskStatusBadge status={params.data.status} />;
}

function PriorityCell(params: ICellRendererParams<ScheduleTaskView>) {
  const p = params.data?.incident?.priority;
  if (!p) return <span className="text-muted-foreground">—</span>;
  return <PriorityBadge priority={p} />;
}

function AddressCell(params: ICellRendererParams<ScheduleTaskView>) {
  const address = params.data?.incident?.address;
  if (!address?.trim()) return <span className="text-muted-foreground">—</span>;
  return <span className="truncate">{address}</span>;
}

export function ScheduleTasksTable({ tasks, onRowClick }: Props) {
  const columnDefs = useMemo<ColDef<ScheduleTaskView>[]>(
    () => [
      {
        field: 'date',
        headerName: az.schedule.colDate,
        minWidth: 150,
        width: 160,
        valueFormatter: (p) => formatBakuDate(p.value as string),
        sort: 'asc',
      },
      {
        field: 'title',
        headerName: az.schedule.colTask,
        flex: 1.5,
        minWidth: 180,
        tooltipField: 'title',
      },
      {
        colId: 'incident',
        headerName: az.schedule.colIncident,
        flex: 1.2,
        minWidth: 160,
        valueGetter: (p) => p.data?.incident?.title ?? '—',
        tooltipValueGetter: (p) => p.data?.incident?.title,
      },
      {
        field: 'startsAt',
        headerName: az.schedule.colStart,
        minWidth: 90,
        width: 100,
        valueFormatter: (p) => formatBakuTime(new Date(p.value as string)),
      },
      {
        field: 'endsAt',
        headerName: az.schedule.colEnd,
        minWidth: 90,
        width: 100,
        valueFormatter: (p) => formatBakuTime(new Date(p.value as string)),
      },
      {
        field: 'status',
        headerName: az.schedule.colStatus,
        width: 130,
        cellRenderer: StatusCell,
      },
      {
        colId: 'priority',
        headerName: az.schedule.colPriority,
        width: 120,
        cellRenderer: PriorityCell,
      },
      {
        colId: 'address',
        headerName: az.schedule.colAddress,
        flex: 1.3,
        minWidth: 200,
        cellRenderer: AddressCell,
        tooltipValueGetter: (p) => p.data?.incident?.address ?? '',
      },
    ],
    [],
  );

  const sorted = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [tasks],
  );

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="p-0">
        <div
          className={cn(
            'ag-theme-alpine ag-theme-shadcn incident-grid h-[min(420px,50vh)] w-full overflow-hidden',
          )}
        >
          <AgGridReact
            rowData={sorted}
            columnDefs={columnDefs}
            defaultColDef={{
              sortable: true,
              resizable: true,
              suppressMovable: true,
            }}
            suppressCellFocus
            pagination
            paginationPageSize={15}
            paginationPageSizeSelector={[15, 25, 50]}
            rowSelection="single"
            onRowClicked={(e) => e.data && onRowClick(e.data)}
            getRowId={(p) => p.data.id}
            localeText={{
              page: 'Səhifə',
              of: '/',
              to: '–',
              next: 'Növbəti',
              previous: 'Əvvəlki',
              pageSizeSelectorLabel: 'Sətir:',
              loadingOoo: az.schedule.loading,
              noRowsToShow: az.schedule.noTasks,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
