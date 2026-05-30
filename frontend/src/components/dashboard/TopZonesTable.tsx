import { Link } from 'react-router-dom';
import { az } from '@/i18n/az';
import type { TopZoneRow, ZoneRiskLevel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RISK_LABEL: Record<ZoneRiskLevel, string> = {
  critical: az.dashboard.riskCritical,
  high: az.dashboard.riskHigh,
  medium: az.dashboard.riskMedium,
  low: az.dashboard.riskLow,
};

const RISK_CLASS: Record<ZoneRiskLevel, string> = {
  critical: 'border-destructive/30 bg-destructive/10 text-destructive',
  high: 'border-orange-500/30 bg-orange-500/10 text-orange-700',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
};

type Props = {
  zones: TopZoneRow[];
};

export function TopZonesTable({ zones }: Props) {
  const total = zones.reduce((sum, z) => sum + z.count, 0);

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{az.dashboard.topZones}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {zones.length === 0 ? (
          <p className="px-6 py-6 text-center text-sm text-muted-foreground">
            {az.dashboard.noData}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Zona</th>
                  <th className="px-2 py-2 font-medium">{az.dashboard.zoneRisk}</th>
                  <th className="px-2 py-2 font-medium">Pay</th>
                  <th className="px-4 py-2 text-right font-medium">{az.dashboard.chartCount}</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const share = total > 0 ? Math.round((zone.count / total) * 100) : 0;
                  return (
                    <tr
                      key={zone.zoneId}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/map?lat=${zone.lat}&lng=${zone.lng}`}
                          className="flex items-center gap-2 font-medium hover:text-primary"
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm border border-white/60 shadow-sm"
                            style={{ backgroundColor: zone.color }}
                            aria-hidden
                          />
                          <span>{az.map.zoneLabel(zone.zoneId)}</span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5">
                        <Badge
                          variant="outline"
                          className={cn('font-normal', RISK_CLASS[zone.riskLevel])}
                        >
                          {RISK_LABEL[zone.riskLevel]}
                        </Badge>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex min-w-[80px] items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${share}%`, backgroundColor: zone.color }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {share}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                        {zone.count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
