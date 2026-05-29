import { CHART } from '@/lib/chartTheme';

export type CategoryChartRow = {
  name: string;
  value: number;
  fill: string;
};

/** All categories for pie — labels only in tooltip on hover */
export function buildCategoryPieRows(
  items: Array<{ name: string; value: number }>,
): CategoryChartRow[] {
  return [...items]
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({
      ...item,
      fill: CHART.category[i % CHART.category.length],
    }));
}

export function categoryPieTotal(rows: CategoryChartRow[]): number {
  return rows.reduce((sum, row) => sum + row.value, 0);
}
