import { IncidentType } from '@prisma/client';
import {
  DEMO_CITIZEN_INCIDENT_BUNDLES,
  flattenIncidentBundles,
} from './demo-40-incidents';
import { DEMO_REPORT_PHOTOS } from './demo-report-assets';

export const SEED_DESCRIPTION_TAG = '\n[seed:v5]';

export type CitizenReporterKey = 'citizen1' | 'citizen2' | 'citizen3';

export type DemoReportSeed = {
  title: string;
  message: string;
  lat: number;
  lng: number;
  categoryKey: string;
  subcategoryKey?: string;
  type?: IncidentType;
  reporterKey: CitizenReporterKey;
  daysAgo: number;
  address?: string;
  photoUrl?: string;
  videoUrl?: string;
};

/** @deprecated Use DEMO_REPORT_PHOTOS */
export const DEMO_REPORT_PHOTO_URL = DEMO_REPORT_PHOTOS.burst;

/** @deprecated Use DEMO_REPORT_PHOTOS */
export const DEMO_REPORT_PHOTO_URL_2 = DEMO_REPORT_PHOTOS.entrance;

export { DEMO_REPORT_PHOTOS };

export const DEMO_REPORT_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

export const NARIMANOV_BBOX = {
  latMin: 40.3995,
  latMax: 40.4188,
  lngMin: 49.8438,
  lngMax: 49.8715,
};

/** 35 grouped citizen incidents (~75 reports); merges via `groupReports`. */
export function buildDemoReports(): DemoReportSeed[] {
  return flattenIncidentBundles(DEMO_CITIZEN_INCIDENT_BUNDLES);
}
