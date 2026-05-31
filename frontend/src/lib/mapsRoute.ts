/** Open Google Maps directions or search (works as default maps handler on many devices). */
export function openMapsRoute(opts: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}): void {
  const { lat, lng, address } = opts;
  let url: string | undefined;

  if (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else if (address?.trim()) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  }

  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
