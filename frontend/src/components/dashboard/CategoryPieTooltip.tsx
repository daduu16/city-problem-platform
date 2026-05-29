import type { TooltipProps } from 'recharts';
import { az } from '@/i18n/az';
import { CHART } from '@/lib/chartTheme';

type PayloadItem = {
  name?: string;
  value?: number;
  payload?: { name?: string; value?: number; fill?: string };
};

export function CategoryPieTooltip({
  active,
  payload,
  total,
}: TooltipProps<number, string> & { total: number }) {
  if (!active || !payload?.length) return null;

  const item = payload[0] as PayloadItem;
  const name = item.payload?.name ?? item.name ?? '—';
  const value = Number(item.value ?? item.payload?.value ?? 0);
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const color = item.payload?.fill;

  return (
    <div style={CHART.tooltip.contentStyle}>
      <p style={{ ...CHART.tooltip.labelStyle, marginBottom: 6 }}>{name}</p>
      <p style={{ ...CHART.tooltip.itemStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
        {color && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
        )}
        <span>
          {az.dashboard.chartCount}: <strong>{value}</strong>
          {' · '}
          {percent}%
        </span>
      </p>
    </div>
  );
}
