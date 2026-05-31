import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { MapIncidentPin } from '@/lib/mapIncidentPin';
import { incidentMarkerHtml } from '@/lib/incidentMarkerHtml';
import type { IncidentClusterFeature } from '@/lib/mapClusterUtils';

interface Props {
	pins: MapIncidentPin[];
	showClusters: boolean;
	clusters: IncidentClusterFeature[];
	clusterReady: boolean;
	onPinClick: (pin: MapIncidentPin) => void;
}

function visiblePinIds(
	pins: MapIncidentPin[],
	showClusters: boolean,
	clusters: IncidentClusterFeature[],
	clusterReady: boolean,
): Set<string> {
	if (!showClusters) {
		return new Set(pins.map((p) => p.incident.id));
	}
	if (!clusterReady) {
		return new Set(pins.map((p) => p.incident.id));
	}

	const ids = new Set<string>();
	for (const f of clusters) {
		if (!f.properties.cluster) {
			ids.add(f.properties.incidentId);
		}
	}

	if (ids.size === 0 && pins.length > 0 && clusters.length === 0) {
		return new Set(pins.map((p) => p.incident.id));
	}

	return ids;
}

export function IncidentMarkers3D({
	pins,
	showClusters,
	clusters,
	clusterReady,
	onPinClick,
}: Props) {
	const visibleIds = useMemo(
		() => visiblePinIds(pins, showClusters, clusters, clusterReady),
		[pins, showClusters, clusters, clusterReady],
	);

	const toRender = pins.filter((p) => visibleIds.has(p.incident.id));

	return (
		<>
			{toRender.map((pin) => {
				const i = pin.incident;
				const { html: inner } = incidentMarkerHtml(pin);
				return (
					<Marker
						key={i.id}
						longitude={pin.lng}
						latitude={pin.lat}
						anchor="center"
						className="map-incident-marker-3d"
						style={{ zIndex: 10 }}
						onClick={(evt) => {
							evt.originalEvent.stopPropagation();
							onPinClick(pin);
						}}
					>
						<div
							className="incident-marker-wrapper"
							dangerouslySetInnerHTML={{ __html: inner }}
						/>
					</Marker>
				);
			})}
		</>
	);
}
