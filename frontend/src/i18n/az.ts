import type { IncidentPriority, IncidentStatus, IncidentType } from '@/types';

/** Azerbaijani UI strings (single locale) */
export const az = {
  app: {
    title: 'Bakı Şəhər Dispatch',
    subtitle: 'Hadisələrin analitik paneli',
    htmlTitle: 'Şəhər hadisələri platforması',
  },
  nav: {
    dashboard: 'İdarə paneli',
    map: 'Xəritə',
    incidents: 'Hadisələr',
    admin: 'Admin',
    signOut: 'Çıxış',
    expandSidebar: 'Yan paneli aç',
    collapseSidebar: 'Yan paneli bağla',
  },
  login: {
    title: 'Dispatch mərkəzi',
    subtitle: 'Şəhər hadisələrinin idarəetmə sistemi',
    email: 'E-poçt',
    password: 'Şifrə',
    submit: 'Daxil ol',
    submitting: 'Daxil olunur…',
    invalidCredentials: 'Yanlış giriş məlumatları',
    demoHint: 'Nümunə: dispatcher@municipal.local / admin123',
  },
  dashboard: {
    title: 'İdarə paneli',
    subtitle: 'Dispetçer idarəetmə mərkəzi',
    loadingKpis: 'Göstəricilər yüklənir…',
    kpiActive: 'Aktiv problemlər',
    kpiOverdue: 'Gecikmiş tapşırıqlar',
    kpiNewToday: 'Bu gün yeni',
    kpiAvgResolution: 'Orta həll müddəti',
    kpiCritical: 'Kritik açıq',
    kpiSla: 'SLA %',
    hourSuffix: ' saat',
    chartTimeline: 'Hadisələrin dinamikası',
    chartCategory: 'Kateqoriyalar üzrə',
    chartStatus: 'Statuslar üzrə',
  },
  map: {
    title: 'Xəritə — Nərimanov, Bakı',
    subtitle: (count: number, areaKm2?: number, viewMode: '2d' | '3d' = '2d') => {
      const base =
        areaKm2 != null
          ? `${count} hadisə · ${areaKm2.toFixed(2)} km² (Nərimanov)`
          : `${count} hadisə · Nərimanov rayonu`;
      const engine =
        viewMode === '3d' ? '3D xəritə (MapLibre)' : 'OpenStreetMap';
      return `${engine} · ${base}`;
    },
    viewMode: 'Xəritə növü',
    view2d: 'Sadə (OSM)',
    view3d: '3D (məkan)',
    tilt3d: '3D bucaq',
    tiltFlat: 'Plan görünüşü',
    district: {
      area: 'Sahə',
      perimeter: 'Perimetr (təxmini)',
      boundaryPoints: 'Sərhəd nöqtələri',
      incidents: 'Hadisələr xəritədə',
      source: 'Məlumat: admin.opendata.az — Azərbaycanın rayonları (GeoJSON)',
      popupTitle: 'Nərimanov rayonu',
    },
    layersTitle: 'Xəritə qatları',
    clustering: 'Klasterləşdirmə',
    heatmap: 'İstilik xəritəsi',
    statusesTitle: 'Statuslar',
    buildingsTitle: 'Binalar (növ üzrə)',
    buildingTypes: {
      residential: 'Yaşayış',
      commercial: 'Kommersiya',
      industrial: 'Sənaye',
      retail: 'Pərakəndə satış',
      office: 'Ofis',
      hotel: 'Otel',
      school: 'Təhsil müəssisəsi',
      hospital: 'Səhiyyə',
      religious: 'Dini bina',
      government: 'Dövlət',
      warehouse: 'Anbar',
      garage: 'Qaraj',
      other: 'Digər',
    },
    layers: {
      water: 'Su',
      gas: 'Qaz',
      electricity: 'Elektrik',
      roads: 'Yollar',
      lighting: 'İşıqlandırma',
      sanitation: 'Sanitariya',
      weather: 'Hava',
      floods: 'Su basması',
      greenery: 'Yaşıllıq',
    },
  },
  admin: {
    title: 'İstifadəçilər',
    subtitle: 'Rollar və giriş hüquqları',
    name: 'Ad',
    email: 'E-poçt',
    role: 'Rol',
    organization: 'Təşkilat',
    access: 'Giriş',
    save: 'Yadda saxla',
    categories: 'Kateqoriyalar',
  },
  incidents: {
    title: 'Hadisələr siyahısı',
    subtitleLoading: 'Yüklənir…',
    subtitleTotal: (total: number) =>
      `${total} cəmi · sıralama, filtr, ixrac`,
    colTitle: 'Müraciət',
    colStatus: 'Status',
    colPriority: 'Prioritet',
    colCategory: 'Kateqoriya',
    colDistrict: 'Rayon',
    colAddress: 'Ünvan',
    colCreated: 'Yaradılıb',
  },
  drawer: {
    loading: 'Yüklənir…',
    loadError: 'Hadisə məlumatı yüklənmədi',
    loadErrorHint: 'Yenidən cəhd edin və ya girişin aktiv olduğunu yoxlayın.',
    assignee: 'İcraçı',
    deadline: 'Son tarix',
    timeline: 'Tarixçə',
    comments: 'Şərhlər',
    commentPlaceholder: 'Şərh yazın…',
    postComment: 'Göndər',
  },
  status: {
    NEW: 'Yeni',
    IN_PROGRESS: 'İcradadır',
    PENDING: 'Gözləmədə',
    RESOLVED: 'Həll edilib',
    OVERDUE: 'Gecikmiş',
    ARCHIVED: 'Arxiv',
  } satisfies Record<IncidentStatus, string>,
  districtStatus: {
    WITHIN_DISTRICT: 'Rayon daxilində',
    OUTSIDE_DISTRICT: 'Rayon xaricində',
  } as Record<string, string>,
  priority: {
    CRITICAL: 'Kritik',
    HIGH: 'Yüksək',
    MEDIUM: 'Orta',
    LOW: 'Aşağı',
  } satisfies Record<IncidentPriority, string>,
  category: {
    water: 'Su',
    gas: 'Qaz',
    electricity: 'Elektrik',
    road_surface: 'Yol örtüyü',
    asphalt_repair: 'Asfalt təmiri',
    broken_lamps: 'İşıq dirəkləri',
    street_dirt: 'Küçə çirklənməsi',
    playgrounds: 'Uşaq meydançası',
    infrastructure: 'İnfrastruktur',
    utilities: 'Kommunal',
    greenery: 'Yaşıllıq',
    weather_emergency: 'Fövqəladə',
    sanitation: 'Sanitariya',
    lighting: 'İşıqlandırma',
    parks: 'Parklar',
    advertising: 'Reklam',
  } as Record<string, string>,
  type: {
    ACCIDENT: 'Qəza',
    COMPLAINT: 'Şikayət',
    INSPECTION: 'Yoxlama',
    EMERGENCY: 'Təcili',
  } satisfies Record<IncidentType, string>,
  role: {
    super_admin: 'Super Admin',
    regional_admin: 'Regional Admin',
    dispatcher: 'Dispetçer',
    analyst: 'Analitik',
    field_worker: 'İcraçı',
    viewer: 'Baxıcı',
    utility_operator: 'Kommunal operator',
  } as Record<string, string>,
  historyAction: {
    CREATED: 'Yaradılıb',
    STATUS_CHANGED: 'Status dəyişdi',
    PRIORITY_CHANGED: 'Prioritet dəyişdi',
    ASSIGNED: 'Təyin edildi',
    COMMENT: 'Şərh',
    ATTACHMENT_ADDED: 'Fayl əlavə edildi',
    DEADLINE_CHANGED: 'Son tarix dəyişdi',
    UPDATED: 'Yeniləndi',
  },
  errors: {
    backendUnreachableTitle: 'API server işləmir',
    backendUnreachable:
      'Backendə qoşula bilmirik. Postgres/Redis üçün: docker compose up -d postgres redis. Sonra backend qovluğunda: npm run dev (port 3001).',
    loginNetwork:
      'Serverə qoşula bilmirik — backend işlədiyindən əmin olun (localhost:3001).',
    retry: 'Yenidən cəhd et',
  },
  pwa: {
    name: 'Bakı Hadisə Dispatch',
    shortName: 'Dispatch',
    description: 'Şəhər hadisələrinin dispatch və analitikası',
  },
} as const;

export function tStatus(status: IncidentStatus): string {
  return az.status[status];
}

export function tDistrictStatus(status: string): string {
  return az.districtStatus[status] ?? status;
}

export function tPriority(priority: IncidentPriority): string {
  return az.priority[priority];
}

export function tCategory(category: string): string {
  return az.category[category] ?? category;
}

export function tType(type: IncidentType): string {
  return az.type[type];
}

export function tRole(roleKey: string): string {
  return az.role[roleKey] ?? roleKey;
}

export function tHistoryAction(action: string): string {
  return (
    az.historyAction[action as keyof typeof az.historyAction] ??
    action.toLowerCase().replace(/_/g, ' ')
  );
}
