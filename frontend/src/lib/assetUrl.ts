const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** Turns `/uploads/...` paths into absolute API URLs for <img src>. */
export function resolvePublicAssetUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) {
    return `${API_URL.replace(/\/$/, '')}${trimmed}`;
  }
  const legacy = trimmed.match(
    /^https?:\/\/(localhost|127\.0\.0\.1):(4000|3001)(\/.*)?$/,
  );
  if (legacy) {
    return `${API_URL.replace(/\/$/, '')}${legacy[3] ?? ''}`;
  }
  return trimmed;
}
