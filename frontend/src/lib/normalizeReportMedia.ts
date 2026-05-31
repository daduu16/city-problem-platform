import { resolvePublicAssetUrl } from '@/lib/assetUrl';

/** API / legacy shapes for optional report media URLs. */
export type ReportMediaSource = {
  photoUrl?: string | null;
  videoUrl?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
};

export function normalizeReportMedia(source: ReportMediaSource) {
  const photoRaw = source.photoUrl ?? source.photo_url ?? null;
  const videoUrl = source.videoUrl ?? source.video_url ?? null;
  const photoUrl = resolvePublicAssetUrl(
    photoRaw && String(photoRaw).trim() ? String(photoRaw) : null,
  );
  return {
    photoUrl,
    videoUrl: videoUrl && String(videoUrl).trim() ? videoUrl : null,
  };
}

export function hasReportMedia(source: ReportMediaSource): boolean {
  const { photoUrl, videoUrl } = normalizeReportMedia(source);
  return Boolean(photoUrl || videoUrl);
}
