/** API / legacy shapes for optional report media URLs. */
export type ReportMediaSource = {
  photoUrl?: string | null;
  videoUrl?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
};

export function normalizeReportMedia(source: ReportMediaSource) {
  const photoUrl = source.photoUrl ?? source.photo_url ?? null;
  const videoUrl = source.videoUrl ?? source.video_url ?? null;
  return {
    photoUrl: photoUrl && String(photoUrl).trim() ? photoUrl : null,
    videoUrl: videoUrl && String(videoUrl).trim() ? videoUrl : null,
  };
}

export function hasReportMedia(source: ReportMediaSource): boolean {
  const { photoUrl, videoUrl } = normalizeReportMedia(source);
  return Boolean(photoUrl || videoUrl);
}
