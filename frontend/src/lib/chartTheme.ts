import { CHART_VARS, hslVar } from '@/lib/themeTokens';

/** Recharts + dashboard charts — shadcn chart tokens */
export const CHART = {
  grid: hslVar('--border'),
  axis: hslVar('--muted-foreground'),
  line: hslVar('--chart-1'),
  legend: hslVar('--muted-foreground'),
  category: CHART_VARS.map((v) => hslVar(v)),
  tooltip: {
    contentStyle: {
      backgroundColor: hslVar('--popover'),
      border: `1px solid ${hslVar('--border')}`,
      borderRadius: 'var(--radius)',
      boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.1)',
      padding: '10px 12px',
    },
    labelStyle: {
      color: hslVar('--muted-foreground'),
      fontSize: 11,
      fontWeight: 600,
      marginBottom: 4,
    },
    itemStyle: {
      color: hslVar('--popover-foreground'),
      fontSize: 12,
      padding: '2px 0',
    },
  },
} as const;

export const chartTooltipProps = {
  contentStyle: CHART.tooltip.contentStyle,
  labelStyle: CHART.tooltip.labelStyle,
  itemStyle: CHART.tooltip.itemStyle,
  cursor: { fill: 'hsl(var(--primary) / 0.08)' },
};
