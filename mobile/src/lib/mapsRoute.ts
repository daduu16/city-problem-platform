import { Linking, Platform } from 'react-native';

/** Open Google Maps directions or search on device. */
export async function openMapsRoute(opts: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}): Promise<void> {
  const { lat, lng, address } = opts;
  let url: string | undefined;

  if (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    const dest = `${lat},${lng}`;
    url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  } else if (address?.trim()) {
    const q = encodeURIComponent(address.trim());
    url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?q=${q}`
        : `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  if (!url) return;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}
