import { useCallback, useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { PathOptions } from 'leaflet';
import {
	DISTRICT_ZONE_DISABLED_STYLE,
	getDistrictZonesCached,
	visibleZonesMapKey,
	type DistrictZoneId,
} from '@/lib/narimanovZones';
import { useMapStore } from '@/stores/mapStore';
import type { NarimanovRayonData } from '@/lib/narimanovRayon';

interface Props {
	rayon: NarimanovRayonData;
}

type ZoneFeatureProps = {
	zoneId: DistrictZoneId;
	color: string;
	fillOpacity: number;
	active: boolean;
};

export function DistrictZones2D({ rayon }: Props) {
	const visibleZones = useMapStore((s) => s.visibleZones);
	const zonesKey = visibleZonesMapKey(visibleZones);

	const collection = useMemo(() => {
		const zones = getDistrictZonesCached(rayon.feature);
		return {
			type: 'FeatureCollection' as const,
			features: zones.map((z) => {
				const active = visibleZones[z.id] !== false;
				return {
					...z.feature,
					properties: {
						zoneId: z.id,
						color: z.color,
						fillOpacity: z.fillOpacity,
						active,
					},
				};
			}),
		};
	}, [rayon.feature, visibleZones]);

	const style = useCallback((feature?: GeoJSON.Feature): PathOptions => {
		const props = feature?.properties as ZoneFeatureProps | undefined;
		const active = props?.active !== false;
		const color = active
			? (props?.color ?? DISTRICT_ZONE_DISABLED_STYLE.color)
			: DISTRICT_ZONE_DISABLED_STYLE.color;
		return {
			color,
			fillColor: color,
			fillOpacity: active
				? (props?.fillOpacity ?? DISTRICT_ZONE_DISABLED_STYLE.fillOpacity)
				: DISTRICT_ZONE_DISABLED_STYLE.fillOpacity,
			weight: 1.5,
			dashArray: active ? '4 3' : '6 4',
		};
	}, [zonesKey]);

	return (
		<GeoJSON key={zonesKey} data={collection} style={style} />
	);
}
