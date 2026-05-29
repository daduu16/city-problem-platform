import {
  DistrictStatus,
  HistoryActionType,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
} from '@prisma/client';

/** Marker appended to descriptions — used to replace seed data on re-run */
export const SEED_DESCRIPTION_TAG = '\n[seed:v2]';

export type DemoIncidentSeed = {
  title: string;
  description: string;
  categoryKey: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  type: IncidentType;
  lat: number;
  lng: number;
  address: string;
  /** Days before now when the incident was created */
  daysAgo: number;
  assign?: boolean;
  organization?: 'municipality' | 'azeriqaz';
  districtStatus?: DistrictStatus;
  comments?: string[];
  history?: Array<{
    actionType: HistoryActionType;
    oldValue?: string;
    newValue?: string;
  }>;
};

/** Realistic addresses and coordinates across Nərimanov */
const LOCATIONS: Array<{ street: string; lat: number; lng: number; building?: string }> = [
  { street: 'Nərimanov pr.', lat: 40.4133, lng: 49.8561, building: '87' },
  { street: 'Nərimanov pr.', lat: 40.4105, lng: 49.854, building: '156' },
  { street: 'Nərimanov pr.', lat: 40.4063, lng: 49.8551, building: '202' },
  { street: 'Bəbək küç.', lat: 40.4043, lng: 49.8591, building: '45' },
  { street: 'Bəbək küç.', lat: 40.4078, lng: 49.8575, building: '102' },
  { street: 'Üzeyir Hacıbəyov küç.', lat: 40.4153, lng: 49.8491, building: '12' },
  { street: 'Təbriz Xanım küç.', lat: 40.4023, lng: 49.8481, building: '28' },
  { street: 'Gənclik mkr.', lat: 40.4123, lng: 49.8611, building: '15' },
  { street: 'Hüseyn Cəbbar küç.', lat: 40.4055, lng: 49.8518, building: '22' },
  { street: 'Akademik Xanəli Rzaev küç.', lat: 40.411, lng: 49.8505, building: '3' },
  { street: 'Axmed Rəcəbli küç.', lat: 40.4083, lng: 49.8521, building: '8' },
  { street: 'Nərimanov küç.', lat: 40.414, lng: 49.8488, building: '5' },
  { street: 'Fatali Khan Khoyski pr.', lat: 40.4039, lng: 49.8663, building: '1' },
  { street: 'Agha Nematulla küç.', lat: 40.4047, lng: 49.8696, building: '49' },
  { street: 'Rəşid Behbudov küç.', lat: 40.4092, lng: 49.8534, building: '17' },
  { street: 'Ziya Bünyadov pr.', lat: 40.4168, lng: 49.8621, building: '34' },
  { street: 'Məhəmməd Hadi küç.', lat: 40.4018, lng: 49.8568, building: '6' },
  { street: 'Səməd Vurğun küç.', lat: 40.4128, lng: 49.8472, building: '91' },
  { street: 'Koroğlu Rəhimov küç.', lat: 40.4071, lng: 49.8602, building: '14' },
  { street: 'Məmməd Araz blv.', lat: 40.4059, lng: 49.8644, building: '120' },
];

function addr(loc: (typeof LOCATIONS)[number]): string {
  const b = loc.building ? `, ${loc.building}` : '';
  return `${loc.street}${b}, Nərimanov r-n, Bakı`;
}

function loc(i: number) {
  return LOCATIONS[i % LOCATIONS.length];
}

function desc(body: string): string {
  return `${body}${SEED_DESCRIPTION_TAG}`;
}

/**
 * Curated realistic incidents + generated volume for charts / map / table.
 */
export function buildDemoIncidents(): DemoIncidentSeed[] {
  const curated: DemoIncidentSeed[] = [
    {
      title: 'Su borusunda partlayış — giriş qapısı yanı',
      description: desc(
        'Sakinlər səhər saatlarında güclü su axını barədə müraciət edib. Boru 1980-ci illərin metal borusudur. Təcili briqada ərazidədir, su kəsilib.',
      ),
      categoryKey: 'water',
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.CRITICAL,
      type: IncidentType.ACCIDENT,
      ...loc(0),
      address: addr(loc(0)),
      daysAgo: 0,
      assign: true,
      comments: ['Azersu briqadası yoldadır.', 'Boru əvəz olunur, təxminən 2 saat.'],
      history: [
        { actionType: HistoryActionType.CREATED, newValue: 'NEW' },
        { actionType: HistoryActionType.STATUS_CHANGED, oldValue: 'NEW', newValue: 'IN_PROGRESS' },
        { actionType: HistoryActionType.ASSIGNED, newValue: 'Rəşad İcraçı' },
      ],
    },
    {
      title: 'Həyət işıq dirəkləri yanmır — 5 dirək',
      description: desc(
        'Bəbək küçəsində həyət daxilində 5 dirək tam söndürülüb. Qaranlıq səbəbindən təhlükə yaradır.',
      ),
      categoryKey: 'broken_lamps',
      status: IncidentStatus.NEW,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.COMPLAINT,
      ...loc(3),
      address: addr(loc(3)),
      daysAgo: 0,
    },
    {
      title: 'Yol üzərində dərin çuxur — avtomobil zədələnib',
      description: desc(
        'Çuxur təxminən 40 sm dərinlikdədir. Zolağın müvəqqəti bağlanması razılaşdırılıb, asfalt materialı sifariş olunub.',
      ),
      categoryKey: 'road_surface',
      status: IncidentStatus.PENDING,
      priority: IncidentPriority.HIGH,
      type: IncidentType.COMPLAINT,
      ...loc(5),
      address: addr(loc(5)),
      daysAgo: 1,
      assign: true,
      comments: ['Material çatdırılması gözlənilir.'],
    },
    {
      title: 'Qaz qoxusu — yaşayış binası',
      description: desc(
        '3-cü mərtəbə sakinləri qaz qoxusu barədə zəng edib. SLA vaxtı keçib, təcili yoxlama tələb olunur.',
      ),
      categoryKey: 'gas',
      status: IncidentStatus.OVERDUE,
      priority: IncidentPriority.CRITICAL,
      type: IncidentType.EMERGENCY,
      ...loc(6),
      address: addr(loc(6)),
      daysAgo: 2,
      organization: 'azeriqaz',
      history: [
        { actionType: HistoryActionType.CREATED, newValue: 'NEW' },
        { actionType: HistoryActionType.STATUS_CHANGED, oldValue: 'NEW', newValue: 'IN_PROGRESS' },
        { actionType: HistoryActionType.STATUS_CHANGED, oldValue: 'IN_PROGRESS', newValue: 'OVERDUE' },
      ],
    },
    {
      title: 'Küçə kənarında tullantı yığılmış',
      description: desc('Konteyner doludur, ətrafında zibillik var. Təmizləmə aparılıb, akt təqdim olunub.'),
      categoryKey: 'street_dirt',
      status: IncidentStatus.RESOLVED,
      priority: IncidentPriority.LOW,
      type: IncidentType.COMPLAINT,
      ...loc(7),
      address: addr(loc(7)),
      daysAgo: 1,
      comments: ['Təmizləmə tamamlandı.', 'Sakin təsdiq etdi.'],
    },
    {
      title: 'Açıq elektrik qutusı — təhlükə',
      description: desc(
        'Transformator yaxınlığında qutu qapağı açıqdır. Uşaq meydançasına 50 m məsafədədir.',
      ),
      categoryKey: 'electricity',
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.HIGH,
      type: IncidentType.ACCIDENT,
      ...loc(2),
      address: addr(loc(2)),
      daysAgo: 0,
      assign: true,
    },
    {
      title: 'Kafedən gecə səs-küyü (arxiv)',
      description: desc('Yoxlama aparılıb, protokol tərtib olunub. İş arxivləşdirilib.'),
      categoryKey: 'playgrounds',
      status: IncidentStatus.ARCHIVED,
      priority: IncidentPriority.LOW,
      type: IncidentType.COMPLAINT,
      ...loc(10),
      address: addr(loc(10)),
      daysAgo: 45,
    },
    {
      title: 'Uşaq meydançasında sınmış yellənçək',
      description: desc('Yellənçəyin boltu zəifləyib. Müfəttiş yoxlaması planlaşdırılıb.'),
      categoryKey: 'playgrounds',
      status: IncidentStatus.NEW,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.INSPECTION,
      ...loc(9),
      address: addr(loc(9)),
      daysAgo: 0,
    },
    {
      title: 'Açıq kanalizasiya manhole',
      description: desc('Təhlükəli manhole, ərazi lentlə əhatə olunub. Qapaq sifariş edilib.'),
      categoryKey: 'road_surface',
      status: IncidentStatus.PENDING,
      priority: IncidentPriority.HIGH,
      type: IncidentType.EMERGENCY,
      ...loc(1),
      address: addr(loc(1)),
      daysAgo: 2,
      assign: true,
    },
    {
      title: 'Pilləkən işıqları dəyişdirilib',
      description: desc('Bütün lampalar dəyişilib, akt imzalanıb.'),
      categoryKey: 'broken_lamps',
      status: IncidentStatus.RESOLVED,
      priority: IncidentPriority.LOW,
      type: IncidentType.COMPLAINT,
      ...loc(4),
      address: addr(loc(4)),
      daysAgo: 0,
    },
    {
      title: 'Planlı su sayğacı yoxlaması gecikib',
      description: desc('Sakin evdə olmayıb, ikinci dəfə təyin olunub.'),
      categoryKey: 'water',
      status: IncidentStatus.OVERDUE,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.INSPECTION,
      ...loc(8),
      address: addr(loc(8)),
      daysAgo: 3,
      assign: true,
    },
    {
      title: 'Sıradan çıxmış işıqfor (arxiv)',
      description: desc('Keçən rübdə təmir edilib, arxivə köçürülüb.'),
      categoryKey: 'asphalt_repair',
      status: IncidentStatus.ARCHIVED,
      priority: IncidentPriority.HIGH,
      type: IncidentType.ACCIDENT,
      ...loc(11),
      address: addr(loc(11)),
      daysAgo: 60,
    },
    {
      title: 'Yaşayış binasının fasadında çat',
      description: desc('Çatın eni 15 sm-dir, təhlükəsizlik bəndi qoyulub.'),
      categoryKey: 'facades',
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.HIGH,
      type: IncidentType.INSPECTION,
      ...loc(13),
      address: addr(loc(13)),
      daysAgo: 4,
      assign: true,
    },
    {
      title: 'Parkda qırılmış skameyka',
      description: desc('Metal oturacaq qırılıb, uşaq meydançası yaxınlığında.'),
      categoryKey: 'benches',
      status: IncidentStatus.NEW,
      priority: IncidentPriority.LOW,
      type: IncidentType.COMPLAINT,
      ...loc(14),
      address: addr(loc(14)),
      daysAgo: 1,
    },
    {
      title: 'Dolmuş zibil qutusu — market yanı',
      description: desc('3 gündür boşaldılmır, qoxu şikayəti var.'),
      categoryKey: 'overflow_bins',
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.COMPLAINT,
      ...loc(15),
      address: addr(loc(15)),
      daysAgo: 2,
      assign: true,
    },
    {
      title: 'Yağışdan sonra su basması — zirzəmi',
      description: desc('Yaşayış binasının zirzəmisində su yığılıb.'),
      categoryKey: 'floods',
      status: IncidentStatus.PENDING,
      priority: IncidentPriority.CRITICAL,
      type: IncidentType.EMERGENCY,
      ...loc(16),
      address: addr(loc(16)),
      daysAgo: 1,
    },
    {
      title: 'Küçədə qaranlıq sahə — park yaxınlığı',
      description: desc('2 dirək ardıcıl yanmır, təhlükəsizlik riski.'),
      categoryKey: 'dark_areas',
      status: IncidentStatus.NEW,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.COMPLAINT,
      ...loc(17),
      address: addr(loc(17)),
      daysAgo: 3,
    },
    {
      title: 'Ağac budaqları yol üzərinə düşüb',
      description: desc('Böyük budaq avtomobil yolunu bağlayıb, kəsilməsi gözlənilir.'),
      categoryKey: 'tree_fall',
      status: IncidentStatus.RESOLVED,
      priority: IncidentPriority.HIGH,
      type: IncidentType.ACCIDENT,
      ...loc(18),
      address: addr(loc(18)),
      daysAgo: 5,
      comments: ['Budaqlar kəsilib, yol açılıb.'],
    },
    {
      title: 'Səki plitələrində çatlar',
      description: desc('Piyada keçidi üçün təhlükəlidir.'),
      categoryKey: 'sidewalks',
      status: IncidentStatus.NEW,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.COMPLAINT,
      ...loc(12),
      address: addr(loc(12)),
      daysAgo: 2,
    },
    {
      title: 'Reklam lövhəsi zədələnib — külək',
      description: desc('Lövhə 45° əyilib, təcili möhkəmləndirmə lazımdır.'),
      categoryKey: 'billboards',
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.HIGH,
      type: IncidentType.ACCIDENT,
      ...loc(19),
      address: addr(loc(19)),
      daysAgo: 1,
      assign: true,
    },
    {
      title: 'Rayon xaricində zibillik — Bayıl',
      description: desc('Koordinatlar Nərimanov rayonu sərhədinin kənarındadır.'),
      categoryKey: 'street_dirt',
      status: IncidentStatus.NEW,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.COMPLAINT,
      lat: 40.365,
      lng: 49.92,
      address: 'Bayıl, Bakı (rayon xaricində)',
      daysAgo: 0,
      districtStatus: DistrictStatus.OUTSIDE_DISTRICT,
    },
  ];

  const generated = generateVolumeIncidents();
  return [...curated, ...generated];
}

/** Extra incidents spread over 21 days for timeline / category charts */
function generateVolumeIncidents(): DemoIncidentSeed[] {
  const templates: Array<{
    title: string;
    body: string;
    categoryKey: string;
    type: IncidentType;
    priority: IncidentPriority;
    status: IncidentStatus;
    org?: 'municipality' | 'azeriqaz';
  }> = [
    {
      title: 'Sızıntı — su sayğacı',
      body: 'Mətbəxdə zəif sızıntı.',
      categoryKey: 'water',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.NEW,
    },
    {
      title: 'Qaz plitəsi alovu zəif',
      body: 'Sakin texniki yoxlama istəyir.',
      categoryKey: 'gas',
      type: IncidentType.INSPECTION,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      org: 'azeriqaz',
    },
    {
      title: 'Elektrik kəsintisi — 2 saat',
      body: 'Mikrorayonda qısa kəsinti.',
      categoryKey: 'electricity',
      type: IncidentType.ACCIDENT,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.RESOLVED,
    },
    {
      title: 'Asfalt çatları — dayanacaq yanı',
      body: 'Kiçik çatlar, planlı təmir.',
      categoryKey: 'asphalt_repair',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.PENDING,
    },
    {
      title: 'İşıq dirəyi əyilib',
      body: 'Dirək 10° əyilib.',
      categoryKey: 'broken_lamps',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.NEW,
    },
    {
      title: 'Kürsü daşları sökülüb',
      body: '3 metr kürsü zədələnib.',
      categoryKey: 'curbs',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.RESOLVED,
    },
    {
      title: 'Ot biçilməyən sahə',
      body: 'Park ətrafı uzun ot.',
      categoryKey: 'mowing',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.IN_PROGRESS,
    },
    {
      title: 'Quru ot örtüyü',
      body: 'Yaşıllıq suvarılmır.',
      categoryKey: 'dry_zones',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.NEW,
    },
    {
      title: 'Buz bağlaması — pilləkən',
      body: 'Soyuq hava, buz təhlükəsi.',
      categoryKey: 'ice',
      type: IncidentType.EMERGENCY,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.RESOLVED,
    },
    {
      title: 'Telefon xətti aşır',
      body: 'Aşağı asılı xətt.',
      categoryKey: 'comm_lines',
      type: IncidentType.ACCIDENT,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.OVERDUE,
    },
    {
      title: 'Fountain işləmir',
      body: 'Park fontanı qurudur.',
      categoryKey: 'fountains',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.PENDING,
    },
    {
      title: 'Vitrin işığı sönük',
      body: 'Mağaza vitrin işığı.',
      categoryKey: 'storefronts',
      type: IncidentType.COMPLAINT,
      priority: IncidentPriority.LOW,
      status: IncidentStatus.ARCHIVED,
    },
    {
      title: 'Tikinti hasarı — müvəqqəti',
      body: 'Hasar küləyə məğlub olub.',
      categoryKey: 'fences',
      type: IncidentType.INSPECTION,
      priority: IncidentPriority.MEDIUM,
      status: IncidentStatus.IN_PROGRESS,
    },
    {
      title: 'Tufan — dam töküntüsü',
      body: 'Damdan parça düşüb.',
      categoryKey: 'storm_damage',
      type: IncidentType.EMERGENCY,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.RESOLVED,
    },
  ];

  const out: DemoIncidentSeed[] = [];
  const statusesForDay: IncidentStatus[] = [
    IncidentStatus.NEW,
    IncidentStatus.IN_PROGRESS,
    IncidentStatus.RESOLVED,
    IncidentStatus.PENDING,
    IncidentStatus.NEW,
    IncidentStatus.RESOLVED,
    IncidentStatus.IN_PROGRESS,
  ];

  for (let day = 0; day < 21; day++) {
    const perDay = day === 0 ? 4 : day % 7 === 0 ? 3 : 2;
    for (let j = 0; j < perDay; j++) {
      const t = templates[(day * 3 + j) % templates.length];
      const l = loc(day + j);
      const status =
        day === 0 && j === 0
          ? t.status
          : statusesForDay[(day + j) % statusesForDay.length];
      out.push({
        title: `${t.title} (${day + 1}-ci gün)`,
        description: desc(t.body),
        categoryKey: t.categoryKey,
        status,
        priority: t.priority,
        type: t.type,
        lat: l.lat + (j * 0.0003 - 0.0005),
        lng: l.lng + (j * 0.0002 - 0.0004),
        address: addr(l),
        daysAgo: day,
        organization: t.org,
        assign: status === IncidentStatus.IN_PROGRESS || status === IncidentStatus.PENDING,
      });
    }
  }

  return out;
}
