/** Local demo report photos (served from /uploads/demo/*). */
export const DEMO_REPORT_PHOTOS = {
  /** Strong water flow after pipe burst on the street. */
  burst: '/uploads/demo/water-burst-main.jpeg',
  /** Building entrance and stairs flooded. */
  entrance: '/uploads/demo/water-entrance.jpeg',
  /** Stairwell / corridor pooling — lift area affected. */
  corridor: '/uploads/demo/water-corridor.jpeg',
  /** Wall and pipe leak, wet plaster. */
  leakWall: '/uploads/demo/water-leak-wall.jpeg',
} as const;

export type DemoReportPhotoKey = keyof typeof DEMO_REPORT_PHOTOS;

/** Source files in backend/tmp (copied to public on seed). */
export const DEMO_REPORT_TMP_FILES: Record<DemoReportPhotoKey, string> = {
  burst: 'WhatsApp Image 2026-05-31 at 11.43.55.jpeg',
  entrance: 'WhatsApp Image 2026-05-31 at 11.44.01.jpeg',
  corridor: 'WhatsApp Image 2026-05-31 at 11.44.01 (1).jpeg',
  leakWall: 'WhatsApp Image 2026-05-31 at 11.44.02.jpeg',
};

export const DEMO_REPORT_PUBLIC_FILES: Record<DemoReportPhotoKey, string> = {
  burst: 'water-burst-main.jpeg',
  entrance: 'water-entrance.jpeg',
  corridor: 'water-corridor.jpeg',
  leakWall: 'water-leak-wall.jpeg',
};
