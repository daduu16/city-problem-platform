import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ICellRendererParams, RowClassParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { format, isToday, isYesterday } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import type { MapIncident, IncidentStatus } from '@/types';
import { az } from '@/i18n/az';
import { formatCategory } from '@/lib/format';
import { getStatusStyle } from '@/lib/incidentStyles';
import { StatusBadge } from './StatusBadge';
import { tDistrictStatus } from '@/i18n/az';
import { PriorityBadge } from './PriorityBadge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  rows: MapIncident[];
  onRowClick: (id: string) => void;
  toolbar?: ReactNode;
}

function StatusCellRenderer(params: ICellRendererParams<MapIncident, IncidentStatus>) {
  if (!params.value) return null;
  return <StatusBadge status={params.value} />;
}

function PriorityCellRenderer(params: ICellRendererParams<MapIncident>) {
  if (!params.data?.priority) return null;
  return <PriorityBadge priority={params.data.priority} />;
}

function AddressCellRenderer(params: ICellRendererParams<MapIncident, string>) {
  if (!params.value) return <span className="text-foreground/50">—</span>;
  return <span className="truncate text-foreground/75">{params.value}</span>;
}

// Human-friendly created date: relative for recent days, otherwise short date
function formatCreatedAt(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  const time = format(date, 'HH:mm');
  if (isToday(date)) return `Bu gün, ${time}`;
  if (isYesterday(date)) return `Dünən, ${time}`;
  return format(date, 'd MMM, HH:mm', { locale: azLocale });
}

export function IncidentGrid({ rows, onRowClick, toolbar }: Props) {
  const columnDefs = useMemo<ColDef<MapIncident>[]>(
    () => [
      {
        field: 'title',
        headerName: az.incidents.colTitle,
        flex: 2,
        minWidth: 220,
        cellClass: 'ag-cell-primary',
        tooltipField: 'title',
      },
      {
        field: 'status',
        headerName: az.incidents.colStatus,
        cellRenderer: StatusCellRenderer,
        width: 160,
      },
      {
        field: 'priority',
        headerName: az.incidents.colPriority,
        cellRenderer: PriorityCellRenderer,
        width: 140,
      },
      {
        colId: 'category',
        headerName: az.incidents.colCategory,
        valueGetter: (p) => p.data?.category?.name ?? p.data?.category?.key,
        valueFormatter: (p) => formatCategory(p.value as string),
        minWidth: 150,
      },
      {
        field: 'districtStatus',
        headerName: az.incidents.colDistrict,
        valueFormatter: (p) =>
          p.value === 'OUTSIDE_DISTRICT' ? tDistrictStatus(p.value as string) : '—',
        width: 160,
        cellClass: (p) =>
          p.value === 'OUTSIDE_DISTRICT' ? 'text-amber-700 font-medium' : '',
      },
      {
        field: 'address',
        headerName: az.incidents.colAddress,
        flex: 1.5,
        minWidth: 180,
        cellRenderer: AddressCellRenderer,
        tooltipField: 'address',
      },
      {
        field: 'createdAt',
        headerName: az.incidents.colCreated,
        valueFormatter: (p) => formatCreatedAt(p.value as string),
        cellClass: 'text-foreground/70',
        width: 170,
      },
    ],
    [],
  );

  const getRowClass = (params: RowClassParams<MapIncident>) => {
    if (!params.data) return '';
    const classes = [getStatusStyle(params.data.status).rowClass];
    if (params.data.districtStatus === 'OUTSIDE_DISTRICT') {
      classes.push('incident-row-outside-district');
    }
    return classes.join(' ');
  };

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {toolbar}
      <CardContent className="p-0">
        <div
          className={cn(
            'ag-theme-alpine ag-theme-shadcn incident-grid h-[calc(100vh-16.5rem)] w-full overflow-hidden',
          )}
        >
          <AgGridReact
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={{
              sortable: true,
              resizable: true,
              suppressMovable: true,
            }}
            animateRows
            suppressCellFocus
            pagination
            paginationPageSize={25}
            paginationPageSizeSelector={[25, 50, 100]}
            rowSelection="single"
            onRowClicked={(e) => e.data && onRowClick(e.data.id)}
            getRowId={(p) => p.data.id}
            getRowClass={getRowClass}
            localeText={{
              page: 'Səhifə',
              of: '/',
              to: '–',
              next: 'Növbəti',
              previous: 'Əvvəlki',
              first: 'İlk',
              last: 'Son',
              pageSizeSelectorLabel: 'Sətir:',
              loadingOoo: 'Yüklənir…',
              noRowsToShow: az.incidents.noRows,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
