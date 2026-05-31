/** Shared incident clustering — 2D (Leaflet) and 3D (Supercluster). */
export const MAP_CLUSTER_RADIUS = 50;

/**
 * Supercluster: clusters are built up to this zoom (inclusive).
 * Above this level only individual incident pins are shown.
 */
export const MAP_CLUSTER_MAX_ZOOM = 15;

/** Leaflet: disable clustering from this zoom upward (map region maxZoom is 20). */
export const MAP_CLUSTER_DISABLE_ZOOM = 16;
