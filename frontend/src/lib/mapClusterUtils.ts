import type { PointFeature } from 'supercluster';

/** Leaflet markercluster size classes by point count. */
export function incidentClusterSizeClass(count: number): string {
	if (count < 10) return 'marker-cluster-small';
	if (count < 100) return 'marker-cluster-medium';
	return 'marker-cluster-large';
}

export type IncidentClusterPointProps = {
	cluster: false;
	incidentId: string;
};

export type IncidentClusterGroupProps = {
	cluster: true;
	point_count: number;
	cluster_id: number;
};

export type IncidentClusterFeature = PointFeature<
	IncidentClusterPointProps | IncidentClusterGroupProps
>;

/** Collect incident IDs from supercluster leaf features. */
export function collectIncidentIdsFromClusterLeaves(
	leaves: Array<PointFeature<IncidentClusterPointProps>>,
): string[] {
	const ids = new Set<string>();
	for (const leaf of leaves) {
		const id = leaf.properties?.incidentId;
		if (id != null) ids.add(String(id));
	}
	return [...ids];
}
