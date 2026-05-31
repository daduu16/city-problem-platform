import { getApiBaseUrl } from '@/config/api';
import type { Problem, ProblemMediaItem } from '@/types';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host.toLowerCase());
}

export function normalizeAssetUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  const base = getApiBaseUrl().replace(/\/$/, '');

  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (isLoopbackHost(parsed.hostname)) {
      return `${base}${parsed.pathname}${parsed.search}`;
    }
    return trimmed;
  } catch {
    // Not a full URL — treat as path segment
    const path = trimmed.startsWith('uploads/') ? `/${trimmed}` : trimmed;
    return path.startsWith('/') ? `${base}${path}` : trimmed;
  }
}

/** Image URIs only (videos excluded) for carousel display. */
export function getProblemImageUris(problem: Problem): string[] {
  const uris: string[] = [];
  const seen = new Set<string>();

  const push = (url?: string | null) => {
    const uri = normalizeAssetUrl(url);
    if (!uri || seen.has(uri)) return;
    seen.add(uri);
    uris.push(uri);
  };

  if (problem.mediaItems?.length) {
    for (const item of problem.mediaItems) {
      if (item.type !== 'image') continue;
      push(item.uri);
    }
    if (uris.length > 0) return uris;
  }

  for (const url of problem.imageUrls ?? []) {
    push(url);
  }
  push(problem.imageUrl);

  return uris;
}

/** @deprecated Use getProblemImageUris */
export function getProblemMediaItems(problem: Problem): ProblemMediaItem[] {
  return getProblemImageUris(problem).map((uri) => ({ uri, type: 'image' as const }));
}

/** @deprecated Use getProblemImageUris */
export function getProblemPhotoUri(problem: Problem): string | undefined {
  return getProblemImageUris(problem)[0];
}

/** @deprecated Use getProblemImageUris */
export function getProblemPhotoGallery(problem: Problem): string[] {
  return getProblemImageUris(problem);
}

/** @deprecated Videos are not shown in the mobile gallery */
export function getProblemVideoUri(_problem: Problem): string | undefined {
  return undefined;
}
