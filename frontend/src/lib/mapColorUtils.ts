/** Darken a hex color for map layers (2D Leaflet + 3D MapLibre). */
export function darkenForMap(hex: string, factor = 0.52): string {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return hex;
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(Math.round(parseInt(clean.slice(0, 2), 16) * factor));
  const g = clamp(Math.round(parseInt(clean.slice(2, 4), 16) * factor));
  const b = clamp(Math.round(parseInt(clean.slice(4, 6), 16) * factor));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function darkenRecord<T extends Record<string, string>>(
  colors: T,
  factor = 0.52,
): T {
  return Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [key, darkenForMap(value, factor)]),
  ) as T;
}
