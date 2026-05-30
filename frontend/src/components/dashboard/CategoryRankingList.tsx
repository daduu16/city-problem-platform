import { az } from '@/i18n/az';
import { formatCategory } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART } from '@/lib/chartTheme';

type Item = {
  category?: { key: string; name: string };
  count: number;
};

type Props = {
  items: Item[];
};

export function CategoryRankingList({ items }: Props) {
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 8);
  const max = sorted[0]?.count ?? 1;

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{az.dashboard.chartCategory}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{az.dashboard.noData}</p>
        ) : (
          sorted.map((item, i) => {
            const name = item.category ? formatCategory(item.category) : '—';
            const pct = Math.round((item.count / max) * 100);
            const fill = CHART.category[i % CHART.category.length];
            return (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-foreground">{name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: fill }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
