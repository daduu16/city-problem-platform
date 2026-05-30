import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import {
	DISTRICT_ZONE_DISABLED_STYLE,
	getDistrictZonesCached,
	visibleZonesMapKey,
} from '@/lib/narimanovZones';
import { useMapStore } from '@/stores/mapStore';
import type { NarimanovRayonData } from '@/lib/narimanovRayon';

const DISABLED_COLOR = DISTRICT_ZONE_DISABLED_STYLE.color;
const DISABLED_FILL_OPACITY = DISTRICT_ZONE_DISABLED_STYLE.fillOpacity;

interface Props {
	rayon: NarimanovRayonData;
}

export function DistrictZones3D({ rayon }: Props) {
	const visibleZones = useMapStore((s) => s.visibleZones);
	const zonesKey = visibleZonesMapKey(visibleZones);

	const collection = useMemo(() => {
		const zones = getDistrictZonesCached(rayon.feature);
		return {
			type: 'FeatureCollection' as const,
			features: zones.map((z) => ({
				...z.feature,
				properties: {
					zoneId: z.id,
					color: z.color,
					fillOpacity: z.fillOpacity,
					active: visibleZones[z.id] !== false,
				},
			})),
		};
	}, [rayon.feature, visibleZones]);

	return (
		<Source
			key={`narimanov-zones-${zonesKey}`}
			id="narimanov-zones"
			type="geojson"
			data={collection}
		>
			<Layer
				id="district-zones-fill"
				type="fill"
				paint={{
					'fill-color': [
						'case',
						['boolean', ['get', 'active'], false],
						['get', 'color'],
						DISABLED_COLOR,
					],
					'fill-opacity': [
						'case',
						['boolean', ['get', 'active'], false],
						['get', 'fillOpacity'],
						DISABLED_FILL_OPACITY,
					],
				}}
			/>
			<Layer
				id="district-zones-outline"
				type="line"
				paint={{
					'line-color': [
						'case',
						['boolean', ['get', 'active'], false],
						['get', 'color'],
						DISABLED_COLOR,
					],
					'line-width': 1.5,
					'line-dasharray': [
						'case',
						['boolean', ['get', 'active'], false],
						['literal', [2, 2]],
						['literal', [4, 3]],
					],
				}}
			/>
		</Source>
	);
}
