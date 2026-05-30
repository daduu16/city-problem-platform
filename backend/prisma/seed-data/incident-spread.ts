/** Max offset (meters) for demo incident coordinates — avoids stacked map pins. */
export const SEED_SPREAD_RADIUS_M = 55;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random offset inside a circle (meters). */
export function spreadWithinRadius(
  lat: number,
  lng: number,
  seed: string,
  radiusM = SEED_SPREAD_RADIUS_M,
): { lat: number; lng: number } {
  const h = hashSeed(seed);
  const angle = ((h % 360) * Math.PI) / 180;
  const dist = (((h >>> 8) % 1000) / 1000) * radiusM;
  const dLat = (dist * Math.cos(angle)) / 6371000 * (180 / Math.PI);
  const dLng =
    (dist * Math.sin(angle)) /
    (6371000 * Math.cos((lat * Math.PI) / 180)) *
    (180 / Math.PI);
  return { lat: lat + dLat, lng: lng + dLng };
}
