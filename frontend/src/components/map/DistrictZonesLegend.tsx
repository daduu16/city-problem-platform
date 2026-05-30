import { useMemo } from 'react';
import {
	DISTRICT_ZONE_DISABLED_STYLE,
	DISTRICT_ZONE_STYLES,
	type DistrictZoneId,
} from '@/lib/narimanovZones';
import { countIncidentsByZone } from '@/lib/mapIncidentCounts';
import { filterIncidentsByDateRange } from '@/lib/filterIncidentsByDateRange';
import { useNarimanovRayon } from '@/hooks/useNarimanovRayon';
import { useMapStore } from '@/stores/mapStore';
import type { MapIncident } from '@/types';
import { az } from '@/i18n/az';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const ZONE_IDS: DistrictZoneId[] = ['A', 'B', 'C', 'D'];

type Props = {
	/** Date-filtered incidents for per-zone counts. */
	incidents: MapIncident[];
};

export function DistrictZonesLegend({ incidents }: Props) {
	const visibleZones = useMapStore((s) => s.visibleZones);
	const toggleZone = useMapStore((s) => s.toggleZone);
	const mapDateFrom = useMapStore((s) => s.mapDateFrom);
	const mapDateTo = useMapStore((s) => s.mapDateTo);
	const { data: rayon } = useNarimanovRayon();

	const incidentsForCounts = useMemo(
		() => filterIncidentsByDateRange(incidents, mapDateFrom, mapDateTo),
		[incidents, mapDateFrom, mapDateTo],
	);

	const zoneCounts = useMemo(
		() => countIncidentsByZone(incidentsForCounts, rayon?.feature),
		[incidentsForCounts, rayon?.feature],
	);

	return (
		<Card className="border-border/80 bg-card/95 shadow-lg backdrop-blur">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{az.map.zonesTitle}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 p-3 pt-0">
				<ul className="space-y-2">
					{ZONE_IDS.map((id) => {
						const style = DISTRICT_ZONE_STYLES[id];
						const checked = visibleZones[id] !== false;
						const count = zoneCounts[id] ?? 0;
						return (
							<li key={id} className="flex items-center gap-2">
								<Checkbox
									id={`zone-${id}`}
									checked={checked}
									onCheckedChange={() => toggleZone(id)}
									className="shrink-0"
								/>
								<Label
									htmlFor={`zone-${id}`}
									className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 text-xs font-normal"
								>
									<span className="flex min-w-0 items-center gap-2">
										<span
											className="h-3 w-3 shrink-0 rounded-sm border border-white/40"
											style={{
												backgroundColor: checked
													? style.color
													: DISTRICT_ZONE_DISABLED_STYLE.color,
												opacity: checked ? 1 : 0.85,
											}}
											aria-hidden
										/>
										<span className={checked ? '' : 'text-muted-foreground'}>
											{az.map.zoneLabel(id)}
										</span>
									</span>
									<span
										className="shrink-0 tabular-nums text-muted-foreground"
										title={az.map.categoryCountHint}
									>
										{count}
									</span>
								</Label>
							</li>
						);
					})}
				</ul>
				<p className="text-[10px] leading-snug text-muted-foreground">
					{az.map.zonesHint}
				</p>
			</CardContent>
		</Card>
	);
}
