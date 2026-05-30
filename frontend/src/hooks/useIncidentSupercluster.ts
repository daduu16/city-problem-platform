import { useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';
import type { MapIncidentPin } from '@/lib/mapIncidentPin';
import {
	MAP_CLUSTER_MAX_ZOOM,
	MAP_CLUSTER_RADIUS,
} from '@/lib/mapClusterConfig';
import type { IncidentClusterFeature } from '@/lib/mapClusterUtils';

export function useIncidentSupercluster(
	pins: MapIncidentPin[],
	enabled: boolean,
): {
	clusters: IncidentClusterFeature[];
	clusterReady: boolean;
	index: Supercluster<IncidentClusterFeature['properties']>;
} {
	const { current: mapRef } = useMap();

	const index = useMemo(() => {
		const sc = new Supercluster<
			IncidentClusterFeature['properties'],
			IncidentClusterFeature['properties']
		>({
			radius: MAP_CLUSTER_RADIUS,
			maxZoom: MAP_CLUSTER_MAX_ZOOM,
		});

		sc.load(
			pins.map((pin) => ({
				type: 'Feature',
				properties: { cluster: false as const, incidentId: pin.incident.id },
				geometry: {
					type: 'Point',
					coordinates: [pin.lng, pin.lat],
				},
			})),
		);

		return sc;
	}, [pins]);

	const [clusters, setClusters] = useState<IncidentClusterFeature[] | null>(
		null,
	);

	useEffect(() => {
		if (!enabled) {
			setClusters(null);
			return;
		}

		const map = mapRef?.getMap();
		if (!map) return;

		const update = () => {
			const bounds = map.getBounds();
			const bbox: [number, number, number, number] = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth(),
			];
			const zoom = Math.floor(map.getZoom());
			setClusters(
				index.getClusters(bbox, zoom) as IncidentClusterFeature[],
			);
		};

		update();
		map.on('moveend', update);
		map.on('zoomend', update);

		return () => {
			map.off('moveend', update);
			map.off('zoomend', update);
		};
	}, [enabled, index, mapRef]);

	return {
		clusters: clusters ?? [],
		clusterReady: clusters !== null,
		index,
	};
}
