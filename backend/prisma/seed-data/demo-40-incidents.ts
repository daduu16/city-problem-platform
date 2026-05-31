import { IncidentPriority, IncidentStatus, IncidentType } from '@prisma/client';
import type { ReportGroupOps } from './demo-report-groups';
import {
  DEMO_REPORT_PHOTO_URL,
  DEMO_REPORT_PHOTO_URL_2,
  DEMO_REPORT_VIDEO_URL,
  type CitizenReporterKey,
  type DemoReportSeed,
} from './demo-reports';
import { spreadWithinRadius } from './incident-spread';

export type DemoIncidentBundle = {
  title: string;
  categoryKey: string;
  subcategoryKey?: string;
  type?: IncidentType;
  locIndex: number;
  ops?: Partial<ReportGroupOps>;
  reports: Array<{
    message: string;
    reporterKey: CitizenReporterKey;
    daysAgo: number;
    spreadKey: string;
    photoUrl?: string;
    videoUrl?: string;
  }>;
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
  { street: 'Fətəli xan Xoyski pr.', lat: 40.4025, lng: 49.8671, building: '5' },
  { street: 'Təbriz küç.', lat: 40.4081, lng: 49.8482, building: '28' },
  { street: 'Azadlıq pr.', lat: 40.4148, lng: 49.8642, building: '102' },
  { street: 'Məmməd Hüseyn Şəhriyar küç.', lat: 40.4062, lng: 49.8551, building: '9' },
  { street: 'Səməd Vurğun küç.', lat: 40.4112, lng: 49.8503, building: '41' },
];

function address(loc: (typeof LOCATIONS)[number]): string {
  const b = loc.building ? `, ${loc.building}` : '';
  return `${loc.street}${b}, Nərimanov r-n, Bakı`;
}

/** 35 citizen-report incidents (grouped); + 5 operator = 40 total in seed. */
export const DEMO_CITIZEN_INCIDENT_BUNDLES: DemoIncidentBundle[] = [
  {
    title: 'Su borusunda partlayış',
    categoryKey: 'water',
    type: IncidentType.ACCIDENT,
    locIndex: 0,
    ops: { status: 'IN_PROGRESS' as const, priority: 'CRITICAL' as const, assign: true },
    reports: [
      { spreadKey: 'w0a', reporterKey: 'citizen1', daysAgo: 0, message: 'Səhər 7-də partlayış səsi, su axını güclüdür.', videoUrl: DEMO_REPORT_VIDEO_URL },
      {
        spreadKey: 'w0b',
        reporterKey: 'citizen2',
        daysAgo: 0,
        message: 'Giriş qapısı yanı tam su altındadır, lift işləmir.',
        photoUrl: DEMO_REPORT_PHOTO_URL_2,
      },
      { spreadKey: 'w0c', reporterKey: 'citizen3', daysAgo: 1, message: 'Dünən də sızıntı olmuşdu, bu gün yenidən partladı.', photoUrl: DEMO_REPORT_PHOTO_URL },
    ],
  },
  {
    title: 'Həyət işıq dirəkləri yanmır',
    categoryKey: 'broken_lamps',
    locIndex: 3,
    ops: { status: 'NEW', priority: 'MEDIUM' },
    reports: [
      { spreadKey: 'l3a', reporterKey: 'citizen2', daysAgo: 0, message: '5 dirək 3 gecə yanmır, təhlükəlidir.', photoUrl: DEMO_REPORT_PHOTO_URL },
      { spreadKey: 'l3b', reporterKey: 'citizen1', daysAgo: 1, message: 'Uşaqlar həyətdə oynaya bilmir, qaranlıqdır.' },
    ],
  },
  {
    title: 'Yol üzərində dərin çuxur',
    categoryKey: 'road_surface',
    locIndex: 5,
    ops: { status: 'PENDING', priority: 'HIGH', assign: true },
    reports: [
      { spreadKey: 'r5a', reporterKey: 'citizen1', daysAgo: 1, message: 'Maşın təkəri çuxura düşüb, təcili düzəldilməlidir.', videoUrl: DEMO_REPORT_VIDEO_URL },
      { spreadKey: 'r5b', reporterKey: 'citizen3', daysAgo: 2, message: 'Çuxur hər gün böyüyür, avtobuslar manevr edə bilmir.' },
    ],
  },
  {
    title: 'Mətbəxdən qaz iyi',
    categoryKey: 'gas',
    type: IncidentType.EMERGENCY,
    locIndex: 2,
    ops: { status: 'IN_PROGRESS', priority: 'CRITICAL', assign: true, organization: 'azeriqaz' },
    reports: [
      { spreadKey: 'g2a', reporterKey: 'citizen1', daysAgo: 0, message: 'Güclü qaz iyi, pəncərə açıq saxlayırıq.' },
      { spreadKey: 'g2b', reporterKey: 'citizen2', daysAgo: 0, message: 'Qonşu mənzildə də eyni qoxu var.' },
    ],
  },
  {
    title: 'Zibil qutusu dolub — Gənclik',
    categoryKey: 'overflow_bins',
    locIndex: 4,
    reports: [
      { spreadKey: 't4a', reporterKey: 'citizen3', daysAgo: 2, message: '3 gündür boşaldılmır, kəskin qoxu.', photoUrl: DEMO_REPORT_PHOTO_URL },
      { spreadKey: 't4b', reporterKey: 'citizen1', daysAgo: 1, message: 'Pişiklər və quşlar ətrafda dolanır.' },
    ],
  },
  {
    title: 'Ağac budanması — tramvay xətti',
    categoryKey: 'tree_fall',
    locIndex: 6,
    ops: { status: 'OVERDUE', priority: 'HIGH', assign: true },
    reports: [
      { spreadKey: 'tr6', reporterKey: 'citizen1', daysAgo: 4, message: 'Budaqlar tramvay xəttinə toxunur, təhlükə var.' },
    ],
  },
  {
    title: 'Yağış suyu küçəni basır',
    categoryKey: 'floods',
    type: IncidentType.EMERGENCY,
    locIndex: 7,
    ops: { status: 'IN_PROGRESS', priority: 'HIGH', assign: true },
    reports: [
      { spreadKey: 'f7a', reporterKey: 'citizen2', daysAgo: 1, message: 'Drenaj tıxılıb, küçə su altındadır.' },
      { spreadKey: 'f7b', reporterKey: 'citizen3', daysAgo: 0, message: 'Yaşlı insanlar keçə bilmir.' },
    ],
  },
  {
    title: 'Elektrik dirəyi titrəyir',
    categoryKey: 'electricity',
    locIndex: 8,
    ops: { status: 'NEW', priority: 'HIGH' },
    reports: [
      { spreadKey: 'e8a', reporterKey: 'citizen1', daysAgo: 0, message: 'Səs-küy var, qısa qapanma olur.' },
      { spreadKey: 'e8b', reporterKey: 'citizen2', daysAgo: 0, message: 'Uşaq evdə işıq söndü, qorxur.' },
    ],
  },
  {
    title: 'Səki daşları sökülüb',
    categoryKey: 'sidewalks',
    locIndex: 9,
    reports: [
      { spreadKey: 'sw9', reporterKey: 'citizen3', daysAgo: 3, message: 'Stroller keçmir, yaşlı nənə yıxıldı.', photoUrl: DEMO_REPORT_PHOTO_URL },
    ],
  },
  {
    title: 'Fasad üzərində çatlar',
    categoryKey: 'facades',
    locIndex: 10,
    ops: { status: 'PENDING', priority: 'MEDIUM' },
    reports: [
      { spreadKey: 'fc10a', reporterKey: 'citizen1', daysAgo: 5, message: 'Çatdan su sızır, divar nəm.' },
      { spreadKey: 'fc10b', reporterKey: 'citizen2', daysAgo: 4, message: 'Boya tökülür, piyadalar üçün təhlükə.' },
    ],
  },
  {
    title: 'Uşaq meydançasında zədələnmə',
    categoryKey: 'playgrounds',
    locIndex: 11,
    reports: [
      { spreadKey: 'pg11a', reporterKey: 'citizen2', daysAgo: 2, message: '1 salıncaq sökülüb, uşaqlar yaralanma riski.' },
      { spreadKey: 'pg11b', reporterKey: 'citizen3', daysAgo: 2, message: 'Dünən axşam da eyni vəziyyət idi.', photoUrl: DEMO_REPORT_PHOTO_URL },
    ],
  },
  {
    title: 'Küçə üzrə çirk və tullantı',
    categoryKey: 'street_dirt',
    locIndex: 12,
    reports: [
      { spreadKey: 'sd12', reporterKey: 'citizen1', daysAgo: 1, message: 'Bazar sonrası tullantılar səpilib.' },
    ],
  },
  {
    title: 'Küçə tam qaranıqdır',
    categoryKey: 'dark_areas',
    locIndex: 13,
    ops: { status: 'IN_PROGRESS', priority: 'MEDIUM', assign: true },
    reports: [
      { spreadKey: 'da13a', reporterKey: 'citizen3', daysAgo: 0, message: 'Son 4 gecə işıq yoxdur.' },
      { spreadKey: 'da13b', reporterKey: 'citizen1', daysAgo: 1, message: 'Qadınlar tək gecə getməkdən çəkinir.' },
    ],
  },
  {
    title: 'Buz bağlaması — pilləkən',
    categoryKey: 'ice',
    locIndex: 1,
    type: IncidentType.ACCIDENT,
    reports: [
      { spreadKey: 'ic1', reporterKey: 'citizen2', daysAgo: 0, message: 'Səhər saatlarında sürüşkən, 2 nəfər sürüşdü.' },
    ],
  },
  {
    title: 'Asfalt layihəsi — çatlar',
    categoryKey: 'asphalt_repair',
    locIndex: 14,
    ops: { status: 'RESOLVED', priority: 'MEDIUM' },
    reports: [
      { spreadKey: 'ar14a', reporterKey: 'citizen1', daysAgo: 8, message: 'Təmirdən sonra yenidən çat əmələ gəlib.' },
      { spreadKey: 'ar14b', reporterKey: 'citizen3', daysAgo: 7, message: 'Maşınlar yavaşlayır, tıxac yaranır.' },
    ],
  },
  {
    title: 'Telefon kabeli açıq qalıb',
    categoryKey: 'comm_lines',
    locIndex: 0,
    reports: [
      { spreadKey: 'cm0', reporterKey: 'citizen2', daysAgo: 2, message: 'Kabel torpaqdan çıxıb, uşaqlar oynayır.' },
    ],
  },
  {
    title: 'Parkda quru ot zonası',
    categoryKey: 'dry_zones',
    locIndex: 10,
    reports: [
      { spreadKey: 'dz10', reporterKey: 'citizen3', daysAgo: 6, message: 'Ot ölüb, toz qalxır, allergiya artır.' },
    ],
  },
  {
    title: 'Fountain işləmir',
    categoryKey: 'fountains',
    locIndex: 4,
    reports: [
      { spreadKey: 'fn4', reporterKey: 'citizen1', daysAgo: 9, message: 'Yay aylarında su verilmir, qoxu gəlir.' },
    ],
  },
  {
    title: 'Skameyka sındırılıb',
    categoryKey: 'benches',
    locIndex: 11,
    reports: [
      { spreadKey: 'bn11a', reporterKey: 'citizen2', daysAgo: 3, message: 'Taxta oturacaq qırılıb, mismar çıxıb.' },
      { spreadKey: 'bn11b', reporterKey: 'citizen1', daysAgo: 3, message: 'Yaşlılar otura bilmir.' },
    ],
  },
  {
    title: 'Reklam lövhəsi əyilib',
    categoryKey: 'billboards',
    locIndex: 5,
    ops: { status: 'NEW', priority: 'LOW' },
    reports: [
      { spreadKey: 'bb5', reporterKey: 'citizen3', daysAgo: 1, message: 'Külək lövhəni əyib, piyada yoluna meyl edib.' },
    ],
  },
  {
    title: 'Tikinti hasarı dağılıb',
    categoryKey: 'fences',
    locIndex: 6,
    reports: [
      { spreadKey: 'fe6a', reporterKey: 'citizen1', daysAgo: 2, message: 'Hasar paneli yerə düşüb.' },
      { spreadKey: 'fe6b', reporterKey: 'citizen2', daysAgo: 1, message: 'Uşaq meydançası yanında, təcili təmizlənməlidir.', photoUrl: DEMO_REPORT_PHOTO_URL },
    ],
  },
  {
    title: 'Mağaza vitrini çatlaq',
    categoryKey: 'storefronts',
    locIndex: 7,
    reports: [
      { spreadKey: 'sf7', reporterKey: 'citizen3', daysAgo: 4, message: 'Şüşə çatlağı böyüyür, təhlükəli.' },
    ],
  },
  {
    title: 'Kürsü daşları dağılıb',
    categoryKey: 'curbs',
    locIndex: 8,
    reports: [
      { spreadKey: 'cb8', reporterKey: 'citizen2', daysAgo: 5, message: 'Parkinq zamanı təkərlər zədələnir.' },
    ],
  },
  {
    title: 'Tufan — ağac yıxılıb',
    categoryKey: 'storm_damage',
    type: IncidentType.EMERGENCY,
    locIndex: 9,
    ops: { status: 'IN_PROGRESS' as const, priority: 'CRITICAL' as const, assign: true },
    reports: [
      { spreadKey: 'st9a', reporterKey: 'citizen1', daysAgo: 0, message: 'Gecə külək ağacı yıxıb, yol bağlıdır.' },
      { spreadKey: 'st9b', reporterKey: 'citizen3', daysAgo: 0, message: 'Video göndərdim, təcili briqada lazımdır.', videoUrl: DEMO_REPORT_VIDEO_URL },
    ],
  },
  {
    title: 'Park otu biçilməyib',
    categoryKey: 'mowing',
    locIndex: 10,
    reports: [
      { spreadKey: 'mw10a', reporterKey: 'citizen2', daysAgo: 6, message: 'Ot diz çanağı qədərdir.' },
      { spreadKey: 'mw10b', reporterKey: 'citizen1', daysAgo: 5, message: 'Cırtdan və gəzdiran çoxalıb.' },
    ],
  },
  {
    title: 'Mənzildə su sızıntısı',
    categoryKey: 'water',
    locIndex: 1,
    reports: [
      { spreadKey: 'w1a', reporterKey: 'citizen3', daysAgo: 2, message: 'Tavan damcıyır, divar köklənir.' },
      { spreadKey: 'w1b', reporterKey: 'citizen2', daysAgo: 1, message: 'Komendant deyir gözləyin — 3 gündür gözləyirik.' },
    ],
  },
  {
    title: 'Küçə lampası partlayıb',
    categoryKey: 'broken_lamps',
    locIndex: 12,
    reports: [
      { spreadKey: 'bl12', reporterKey: 'citizen1', daysAgo: 1, message: 'Lampa partlayıb, şüşə tökülüb.' },
    ],
  },
  {
    title: 'Asfalt qatı qalxıb',
    categoryKey: 'road_surface',
    locIndex: 13,
    ops: { status: 'NEW', priority: 'MEDIUM' },
    reports: [
      { spreadKey: 'rs13', reporterKey: 'citizen2', daysAgo: 0, message: 'Yol ortasında qabarıq, sürət azaldılmalıdır.' },
    ],
  },
  {
    title: 'Qaz sayğacı sızması',
    categoryKey: 'gas',
    locIndex: 14,
    ops: { status: 'PENDING', priority: 'HIGH', organization: 'azeriqaz' },
    reports: [
      { spreadKey: 'gs14a', reporterKey: 'citizen3', daysAgo: 1, message: 'Sayğac yanında sızıntı səsi.' },
      { spreadKey: 'gs14b', reporterKey: 'citizen1', daysAgo: 0, message: 'Azeriqaz gəldi, hələ bağlanmayıb deyirlər.' },
    ],
  },
  {
    title: 'Zibil konteyneri — Bəbək küç.',
    categoryKey: 'overflow_bins',
    locIndex: 2,
    reports: [
      { spreadKey: 'zb2a', reporterKey: 'citizen2', daysAgo: 0, message: 'Axşam saatlarında qoxu dövr edir.' },
      { spreadKey: 'zb2b', reporterKey: 'citizen3', daysAgo: 0, message: 'Eyni konteyner — həftə sonu da dolu qalıb.' },
      { spreadKey: 'zb2c', reporterKey: 'citizen1', daysAgo: 1, message: 'Mən də eyni yerdə müraciət etmişdim.' },
    ],
  },
  {
    title: 'Park ağacı yıxılma təhlükəsi',
    categoryKey: 'tree_fall',
    locIndex: 3,
    reports: [
      { spreadKey: 'tf3', reporterKey: 'citizen1', daysAgo: 2, message: 'Kök hissəsi açılıb, meyl edib.' },
    ],
  },
  {
    title: 'Məhəllədə elektrik kəsintisi',
    categoryKey: 'electricity',
    locIndex: 4,
    ops: { status: 'RESOLVED', priority: 'HIGH' },
    reports: [
      { spreadKey: 'el4a', reporterKey: 'citizen2', daysAgo: 9, message: '4 saat işıq yox idi.' },
      { spreadKey: 'el4b', reporterKey: 'citizen3', daysAgo: 8, message: 'Soyuducu əridi, itkilər oldu.' },
    ],
  },
  {
    title: 'Zirzəmi su basması',
    categoryKey: 'floods',
    locIndex: 5,
    reports: [
      { spreadKey: 'fl5', reporterKey: 'citizen1', daysAgo: 3, message: 'Yağışdan sonra zirzəmi tam dolub.' },
    ],
  },
  {
    title: 'Küçə təmizlənmir',
    categoryKey: 'street_dirt',
    locIndex: 6,
    ops: { status: 'ARCHIVED', priority: 'LOW' },
    reports: [
      { spreadKey: 'st6a', reporterKey: 'citizen3', daysAgo: 14, message: '2 həftədir yuyulmur.' },
      { spreadKey: 'st6b', reporterKey: 'citizen2', daysAgo: 13, message: 'Bazar yerində tullantı qalıb.' },
    ],
  },
  {
    title: 'Şüşə parçası meydançada',
    categoryKey: 'playgrounds',
    locIndex: 7,
    reports: [
      { spreadKey: 'pg7', reporterKey: 'citizen2', daysAgo: 0, message: 'Şüşə parçaları torpaqda, uşaq əlini kəsdi.' },
    ],
  },
];

export function flattenIncidentBundles(bundles: DemoIncidentBundle[]): DemoReportSeed[] {
  const out: DemoReportSeed[] = [];

  for (const bundle of bundles) {
    const base = LOCATIONS[bundle.locIndex % LOCATIONS.length];
    const baseAddr = address(base);

    for (const r of bundle.reports) {
      const pos = spreadWithinRadius(base.lat, base.lng, r.spreadKey);
      out.push({
        title: bundle.title,
        message: r.message,
        lat: pos.lat,
        lng: pos.lng,
        address: baseAddr,
        categoryKey: bundle.categoryKey,
        subcategoryKey: bundle.subcategoryKey,
        type: bundle.type,
        reporterKey: r.reporterKey,
        daysAgo: r.daysAgo,
        photoUrl: r.photoUrl,
        videoUrl: r.videoUrl,
      });
    }
  }

  return out;
}

/** Map bundle title → explicit ops override after grouping. */
export function bundleOpsByTitle(
  bundles: DemoIncidentBundle[],
): Map<string, Partial<ReportGroupOps>> {
  const map = new Map<string, Partial<ReportGroupOps>>();
  for (const b of bundles) {
    if (b.ops) map.set(b.title, b.ops);
  }
  return map;
}
