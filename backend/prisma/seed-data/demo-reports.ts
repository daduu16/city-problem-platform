import { IncidentType } from '@prisma/client';
import { spreadWithinRadius } from './incident-spread';

export const SEED_DESCRIPTION_TAG = '\n[seed:v4]';

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

/** Stable demo media URLs for seed data */
export const DEMO_REPORT_PHOTO_URL =
  'https://picsum.photos/seed/narimanov-trash/640/480';
/** Known-embeddable YouTube watch URL for demo iframes */
export const DEMO_REPORT_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

export const NARIMANOV_BBOX = {
  latMin: 40.3995,
  latMax: 40.4188,
  lngMin: 49.8438,
  lngMax: 49.8715,
};

const LOCATIONS: Array<{ street: string; lat: number; lng: number; building?: string }> = [
  { street: 'Nərimanov pr.', lat: 40.4133, lng: 49.8561, building: '87' },
  { street: 'Nərimanov pr.', lat: 40.4105, lng: 49.854, building: '156' },
  { street: 'Bəbək küç.', lat: 40.4043, lng: 49.8591, building: '45' },
  { street: 'Üzeyir Hacıbəyov küç.', lat: 40.4153, lng: 49.8491, building: '12' },
  { street: 'Gənclik mkr.', lat: 40.4123, lng: 49.8611, building: '15' },
  { street: 'Hüseyn Cəbbar küç.', lat: 40.4055, lng: 49.8518, building: '22' },
  { street: 'Rəşid Behbudov küç.', lat: 40.4092, lng: 49.8534, building: '17' },
  { street: 'Ziya Bünyadov pr.', lat: 40.4168, lng: 49.8621, building: '34' },
  { street: 'Məhəmməd Hadi küç.', lat: 40.4018, lng: 49.8568, building: '6' },
  { street: 'Koroğlu Rəhimov küç.', lat: 40.4071, lng: 49.8602, building: '14' },
];

function addr(loc: (typeof LOCATIONS)[number]): string {
  const b = loc.building ? `, ${loc.building}` : '';
  return `${loc.street}${b}, Nərimanov r-n, Bakı`;
}

function loc(i: number, spreadSeed: string) {
  const base = LOCATIONS[i % LOCATIONS.length];
  return { ...spreadWithinRadius(base.lat, base.lng, spreadSeed), address: addr(base) };
}

function report(
  partial: Omit<DemoReportSeed, 'lat' | 'lng'> & { locIndex: number; spreadSeed: string },
): DemoReportSeed {
  const { locIndex, spreadSeed, ...rest } = partial;
  const pos = loc(locIndex, spreadSeed);
  return { ...rest, lat: pos.lat, lng: pos.lng, address: rest.address ?? pos.address };
}

/** Curated citizen reports — grouped into incidents by `groupReports`. */
function curatedReports(): DemoReportSeed[] {
  return [
    report({
      locIndex: 0,
      spreadSeed: 'water-0a',
      title: 'Su borusunda partlayış',
      message: 'Səhər 7-də partlayış səsi eşitdik, su axını güclüdür.',
      categoryKey: 'water',
      reporterKey: 'citizen1',
      daysAgo: 0,
      type: IncidentType.ACCIDENT,
      videoUrl: DEMO_REPORT_VIDEO_URL,
    }),
    report({
      locIndex: 0,
      spreadSeed: 'water-0b',
      title: 'Su borusunda partlayış',
      message: 'Giriş qapısı yanı tam su altındadır, lift işləmir.',
      categoryKey: 'water',
      reporterKey: 'citizen2',
      daysAgo: 0,
    }),
    report({
      locIndex: 0,
      spreadSeed: 'water-0c',
      title: 'Su borusunda partlayış',
      message: 'Eyni problemi dünən də görmüşdük, təkrar baş verib.',
      categoryKey: 'water',
      reporterKey: 'citizen3',
      daysAgo: 0,
    }),
    report({
      locIndex: 3,
      spreadSeed: 'lamp-3a',
      title: 'Həyət işıq dirəkləri yanmır',
      message: '5 dirək artıq 3 gecə yanmır, təhlükəlidir.',
      categoryKey: 'broken_lamps',
      reporterKey: 'citizen2',
      daysAgo: 0,
      photoUrl: 'https://picsum.photos/seed/narimanov-lamps/640/480',
      videoUrl: DEMO_REPORT_VIDEO_URL,
    }),
    report({
      locIndex: 3,
      spreadSeed: 'lamp-3b',
      title: 'Həyət işıq dirəkləri yanmır',
      message: 'Uşaqlar həyətdə oynaya bilmir, qaranlıqdır.',
      categoryKey: 'broken_lamps',
      reporterKey: 'citizen1',
      daysAgo: 0,
    }),
    report({
      locIndex: 5,
      spreadSeed: 'road-5a',
      title: 'Yol üzərində dərin çuxur',
      message: 'Maşın təkəri çuxura düşüb, təcili düzəldilməlidir.',
      categoryKey: 'road_surface',
      reporterKey: 'citizen1',
      daysAgo: 1,
      videoUrl: DEMO_REPORT_VIDEO_URL,
    }),
    report({
      locIndex: 1,
      spreadSeed: 'road-video-only',
      title: 'Küçə deformasiyası — video sübut',
      message: 'Yolun vəziyyətini videoda çəkmişəm, zəhmət olmasa baxın.',
      categoryKey: 'road_surface',
      reporterKey: 'citizen2',
      daysAgo: 0,
      videoUrl: DEMO_REPORT_VIDEO_URL,
    }),
    report({
      locIndex: 5,
      spreadSeed: 'road-5b',
      title: 'Yol üzərində dərin çuxur',
      message: 'Çuxur hər gün böyüyür, avtomobillər manevr edə bilmir.',
      categoryKey: 'road_surface',
      reporterKey: 'citizen3',
      daysAgo: 1,
    }),
    report({
      locIndex: 2,
      spreadSeed: 'gas-2a',
      title: 'Qaz iyi — mətbəx',
      message: 'Mətbəxdən güclü qaz iyi gəlir, pəncərə açıq saxlayırıq.',
      categoryKey: 'gas',
      reporterKey: 'citizen1',
      daysAgo: 0,
      type: IncidentType.EMERGENCY,
    }),
    report({
      locIndex: 2,
      spreadSeed: 'gas-2b',
      title: 'Qaz iyi — mətbəx',
      message: 'Qonşu mənzildə də eyni qoxu var.',
      categoryKey: 'gas',
      reporterKey: 'citizen2',
      daysAgo: 0,
      type: IncidentType.EMERGENCY,
    }),
    report({
      locIndex: 4,
      spreadSeed: 'trash-4',
      title: 'Zibil qutusu dolub',
      message: '3 gündür boşaldılmır, kəskin qoxu var.',
      categoryKey: 'overflow_bins',
      reporterKey: 'citizen3',
      daysAgo: 2,
      photoUrl: DEMO_REPORT_PHOTO_URL,
      videoUrl: DEMO_REPORT_VIDEO_URL,
    }),
    report({
      locIndex: 6,
      spreadSeed: 'tree-6',
      title: 'Ağac budanması lazımdır',
      message: 'Budaqlar tramvay xəttinə toxunur.',
      categoryKey: 'tree_fall',
      reporterKey: 'citizen1',
      daysAgo: 3,
    }),
    report({
      locIndex: 7,
      spreadSeed: 'flood-7',
      title: 'Yağış suyu — yol',
      message: 'Drenaj tıxılıb, küçə su altındadır.',
      categoryKey: 'floods',
      reporterKey: 'citizen2',
      daysAgo: 1,
      type: IncidentType.EMERGENCY,
    }),
    report({
      locIndex: 8,
      spreadSeed: 'power-8',
      title: 'Elektrik dirəyi titrəyir',
      message: 'Səs-küy var, qısa qapanma olur.',
      categoryKey: 'electricity',
      reporterKey: 'citizen1',
      daysAgo: 0,
    }),
  ];
}

const VOLUME_TOPICS: Array<{
  title: string;
  message: string;
  categoryKey: string;
  subcategoryKey?: string;
}> = [
  { title: 'Sızıntı — boru', message: 'Divardan nəmlik.', categoryKey: 'water' },
  { title: 'Fənər sönük', message: 'Küçə işığı yanmır.', categoryKey: 'broken_lamps' },
  { title: 'Asfalt çatlağı', message: 'Kiçik çat.', categoryKey: 'road_surface' },
  { title: 'Zibil konteyner', message: 'Overflow.', categoryKey: 'overflow_bins' },
  { title: 'Park ot biçilməsi', message: 'Hündür ot.', categoryKey: 'mowing' },
];

function volumeReports(): DemoReportSeed[] {
  const rows = 4;
  const cols = 5;
  const days = 14;
  const reporters: CitizenReporterKey[] = ['citizen1', 'citizen2', 'citizen3'];
  const out: DemoReportSeed[] = [];

  for (let day = 0; day < days; day++) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const topic = VOLUME_TOPICS[(row + col + day) % VOLUME_TOPICS.length];
        const lat =
          NARIMANOV_BBOX.latMin +
          ((NARIMANOV_BBOX.latMax - NARIMANOV_BBOX.latMin) * (row + 0.5)) / rows;
        const lng =
          NARIMANOV_BBOX.lngMin +
          ((NARIMANOV_BBOX.lngMax - NARIMANOV_BBOX.lngMin) * (col + 0.5)) / cols;
        const base = spreadWithinRadius(lat, lng, `vol-${day}-${row}-${col}`);
        const reportCount = 1 + ((row + col + day) % 3);

        for (let r = 0; r < reportCount; r++) {
          const pos = spreadWithinRadius(
            base.lat,
            base.lng,
            `vol-${day}-${row}-${col}-r${r}`,
            85,
          );
          const cell = day * 100 + row * 10 + col + r;
          out.push({
            title: topic.title,
            message: `${topic.message} (gün ${day + 1}, müraciət ${r + 1})`,
            lat: pos.lat,
            lng: pos.lng,
            categoryKey: topic.categoryKey,
            subcategoryKey: topic.subcategoryKey,
            reporterKey: reporters[(row + col + r + day) % reporters.length],
            daysAgo: day,
            address: `Nərimanov r-n, Bakı (xana ${row + 1}×${col + 1})`,
            photoUrl: cell % 6 === 0 ? DEMO_REPORT_PHOTO_URL : undefined,
            videoUrl: cell % 5 === 0 ? DEMO_REPORT_VIDEO_URL : undefined,
          });
        }
      }
    }
  }

  return out;
}

export function buildDemoReports(): DemoReportSeed[] {
  return [...curatedReports(), ...volumeReports()];
}
