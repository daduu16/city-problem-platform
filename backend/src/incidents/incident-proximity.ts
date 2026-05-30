/** Radius (meters) to treat citizen reports as the same on-map incident. */
export const INCIDENT_MERGE_RADIUS_M = 90;

/** Reports within this window can attach to the same open incident. */
export const INCIDENT_MERGE_TIME_WINDOW_MS = 14 * 24 * 3600000;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function isSameIncidentType(
  categoryIdA: string,
  subcategoryIdA: string | null | undefined,
  categoryIdB: string,
  subcategoryIdB: string | null | undefined,
): boolean {
  if (categoryIdA !== categoryIdB) return false;
  return (subcategoryIdA ?? null) === (subcategoryIdB ?? null);
}

export function isWithinMergeRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusM = INCIDENT_MERGE_RADIUS_M,
): boolean {
  return haversineMeters(lat1, lng1, lat2, lng2) <= radiusM;
}

/** Normalized incident topic (title without location suffix). */
export function normalizeIncidentTopic(title: string): string {
  const trimmed = title.trim();
  const sep = ' — ';
  const idx = trimmed.indexOf(sep);
  const core = idx >= 0 ? trimmed.slice(0, idx) : trimmed;
  return core.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function centroidFromCoordinates(
  points: Array<{ lat: number; lng: number }>,
): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

export function isSameIncidentTopic(titleA: string, titleB: string): boolean {
  const a = normalizeIncidentTopic(titleA);
  const b = normalizeIncidentTopic(titleB);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 12 && b.length >= 12) {
    return a.includes(b) || b.includes(a);
  }
  return false;
}
