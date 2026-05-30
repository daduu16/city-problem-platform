import {
  DistrictStatus,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
} from '@prisma/client';
import { spreadWithinRadius } from './incident-spread';
import { SEED_DESCRIPTION_TAG, type DemoReportSeed } from './demo-reports';

export type DemoOperatorIncident = {
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  categoryKey: string;
  subcategoryKey?: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  type: IncidentType;
  daysAgo: number;
  assign?: boolean;
  organization?: 'municipality' | 'azeriqaz';
  districtStatus?: DistrictStatus;
  comments?: string[];
  /** Citizen reports that attach to this dispatcher-created incident */
  lateReports?: DemoReportSeed[];
};

function desc(body: string): string {
  return `${body}${SEED_DESCRIPTION_TAG}`;
}

const DISPATCHER_POINT = {
  lat: 40.4115,
  lng: 49.8555,
  address: 'Nərimanov pr., 120, Nərimanov r-n, Bakı',
};

export function buildDemoOperatorIncidents(): DemoOperatorIncident[] {
  const base = DISPATCHER_POINT;
  const nearA = spreadWithinRadius(base.lat, base.lng, 'op-late-a', 75);
  const nearB = spreadWithinRadius(base.lat, base.lng, 'op-late-b', 82);

  return [
    {
      title: 'Planlı yol təmiri — Nərimanov pr.',
      description: desc(
        'Dispetçer qeydi: zolağın qismən bağlanması, asfalt layihəsi təsdiqlənib.',
      ),
      ...base,
      categoryKey: 'road_surface',
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.HIGH,
      type: IncidentType.INSPECTION,
      daysAgo: 2,
      assign: true,
      lateReports: [
        {
          title: 'Planlı yol təmiri — Nərimanov pr.',
          message: 'Səs-küy çoxdur, pəncərələri bağlaya bilmirik.',
          lat: nearA.lat,
          lng: nearA.lng,
          categoryKey: 'road_surface',
          reporterKey: 'citizen2',
          daysAgo: 1,
          address: base.address,
        },
        {
          title: 'Planlı yol təmiri — Nərimanov pr.',
          message: 'Uşaq bağçası yanında toz çoxdur.',
          lat: nearB.lat,
          lng: nearB.lng,
          categoryKey: 'road_surface',
          reporterKey: 'citizen1',
          daysAgo: 0,
          address: base.address,
        },
      ],
    },
    {
      title: 'Məktəb yanı işıqlandırma yoxlaması',
      description: desc('Dispetçer: məktəbəqədər ərazidə planlı yoxlama.'),
      lat: 40.4142,
      lng: 49.8498,
      address: 'Üzeyir Hacıbəyov küç., 8, Nərimanov r-n, Bakı',
      categoryKey: 'broken_lamps',
      status: IncidentStatus.NEW,
      priority: IncidentPriority.MEDIUM,
      type: IncidentType.INSPECTION,
      daysAgo: 1,
    },
    {
      title: 'Kommunal nəzarət — zibil sahəsi',
      description: desc('Dispetçer: müvəqqəti anbar sahəsi monitorinqi.'),
      lat: 40.4068,
      lng: 49.8625,
      address: 'Gənclik mkr., 22, Nərimanov r-n, Bakı',
      categoryKey: 'overflow_bins',
      status: IncidentStatus.PENDING,
      priority: IncidentPriority.LOW,
      type: IncidentType.INSPECTION,
      daysAgo: 3,
      assign: true,
    },
    {
      title: 'Qaz şəbəkəsi planlı yoxlama',
      description: desc('Dispetçer: Azeriqaz planlı yoxlama nöqtəsi.'),
      lat: 40.4089,
      lng: 49.8582,
      address: 'Bəbək küç., 30, Nərimanov r-n, Bakı',
      categoryKey: 'gas',
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.HIGH,
      type: IncidentType.INSPECTION,
      daysAgo: 0,
      organization: 'azeriqaz',
      assign: true,
    },
    {
      title: 'Park sahəsi — təcili budama',
      description: desc('Dispetçer: güclü külək sonrası yıxılmış budaq.'),
      lat: 40.4025,
      lng: 49.8671,
      address: 'Fatali Khan Khoyski pr., 5, Nərimanov r-n, Bakı',
      categoryKey: 'tree_fall',
      status: IncidentStatus.OVERDUE,
      priority: IncidentPriority.HIGH,
      type: IncidentType.COMPLAINT,
      daysAgo: 4,
      assign: true,
    },
  ];
}
