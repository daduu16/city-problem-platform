import {
  IncidentAssigneeTaskScheduleType,
  IncidentAssigneeTaskStatus,
} from '@prisma/client';
import { SEED_ASSIGNEES } from './assignees';

export type SeedAssigneeTaskDef = {
  id: string;
  assigneeId: string;
  /** Match incident.title (substring). */
  incidentTitleContains: string;
  title: string;
  description?: string;
  /** Baku calendar day offset from today (0 = today). */
  daysFromToday: number;
  startHour: number;
  startMinute?: number;
  durationMinutes: number;
  scheduleType?: IncidentAssigneeTaskScheduleType;
  status?: IncidentAssigneeTaskStatus;
};

const A = SEED_ASSIGNEES;

/** Stable demo tasks for executor schedule (upserted on seed). */
export const SEED_ASSIGNEE_TASKS: SeedAssigneeTaskDef[] = [
  // Kamran Mammadli — kommunal / yol
  {
    id: '00000000-0000-4000-8100-000000000001',
    assigneeId: A[0]!.id,
    incidentTitleContains: 'Su borusunda',
    title: 'Boru partlayışı — təcili müdaxilə',
    daysFromToday: 0,
    startHour: 8,
    startMinute: 30,
    durationMinutes: 120,
    status: IncidentAssigneeTaskStatus.IN_PROGRESS,
  },
  {
    id: '00000000-0000-4000-8100-000000000002',
    assigneeId: A[0]!.id,
    incidentTitleContains: 'Yol üzərində dərin çuxur',
    title: 'Çuxurun bağlanması',
    daysFromToday: 1,
    startHour: 10,
    durationMinutes: 180,
  },
  {
    id: '00000000-0000-4000-8100-000000000003',
    assigneeId: A[0]!.id,
    incidentTitleContains: 'Asfalt layihəsi',
    title: 'Asfalt yamağı',
    daysFromToday: -2,
    startHour: 14,
    durationMinutes: 90,
    status: IncidentAssigneeTaskStatus.SCHEDULED,
  },
  {
    id: '00000000-0000-4000-8100-000000000004',
    assigneeId: A[0]!.id,
    incidentTitleContains: 'Su borusunda',
    title: 'Yoxlama — sızıntı zonası',
    daysFromToday: 2,
    startHour: 9,
    durationMinutes: 60,
  },
  {
    id: '00000000-0000-4000-8100-000000000005',
    assigneeId: A[0]!.id,
    incidentTitleContains: 'Fasad üzərində çatlar',
    title: 'Divar və boru yoxlaması',
    daysFromToday: 4,
    startHour: 11,
    durationMinutes: 75,
  },

  // Nərimanov Kommunal Briqadası
  {
    id: '00000000-0000-4000-8100-000000000011',
    assigneeId: A[1]!.id,
    incidentTitleContains: 'Zibil qutusu',
    title: 'Konteynerin boşaldılması',
    daysFromToday: 0,
    startHour: 7,
    durationMinutes: 45,
  },
  {
    id: '00000000-0000-4000-8100-000000000012',
    assigneeId: A[1]!.id,
    incidentTitleContains: 'Səki daşları',
    title: 'Səki daşlarının bərpası',
    daysFromToday: 1,
    startHour: 13,
    durationMinutes: 150,
  },
  {
    id: '00000000-0000-4000-8100-000000000013',
    assigneeId: A[1]!.id,
    incidentTitleContains: 'Küçə üzrə çirk',
    title: 'Küçənin yuyulması',
    daysFromToday: -1,
    startHour: 6,
    startMinute: 30,
    durationMinutes: 120,
  },
  {
    id: '00000000-0000-4000-8100-000000000014',
    assigneeId: A[1]!.id,
    incidentTitleContains: 'Uşaq meydançasında',
    title: 'Ərazinin təmizlənməsi',
    daysFromToday: 3,
    startHour: 15,
    durationMinutes: 60,
  },

  // Yaşıllaşdırma
  {
    id: '00000000-0000-4000-8100-000000000021',
    assigneeId: A[2]!.id,
    incidentTitleContains: 'Ağac budanması',
    title: 'Budaq kəsilməsi — tramvay xətti',
    daysFromToday: 0,
    startHour: 10,
    durationMinutes: 180,
    status: IncidentAssigneeTaskStatus.IN_PROGRESS,
  },
  {
    id: '00000000-0000-4000-8100-000000000022',
    assigneeId: A[2]!.id,
    incidentTitleContains: 'Parkda quru ot',
    title: 'Ot sahəsinin sulaması',
    daysFromToday: 2,
    startHour: 8,
    durationMinutes: 90,
  },
  {
    id: '00000000-0000-4000-8100-000000000023',
    assigneeId: A[2]!.id,
    incidentTitleContains: 'Ağac budanması',
    title: 'Təkrar yoxlama',
    daysFromToday: 5,
    startHour: 9,
    startMinute: 30,
    durationMinutes: 60,
  },
  {
    id: '00000000-0000-4000-8100-000000000024',
    assigneeId: A[2]!.id,
    incidentTitleContains: 'Skameyka sındırılıb',
    title: 'Meşə materialının daşınması',
    daysFromToday: -1,
    startHour: 14,
    durationMinutes: 45,
  },

  // İşıqlandırma
  {
    id: '00000000-0000-4000-8100-000000000031',
    assigneeId: A[3]!.id,
    incidentTitleContains: 'Həyət işıq dirəkləri',
    title: 'Dirəklərin yoxlanması',
    daysFromToday: 0,
    startHour: 18,
    durationMinutes: 90,
  },
  {
    id: '00000000-0000-4000-8100-000000000032',
    assigneeId: A[3]!.id,
    incidentTitleContains: 'Küçə tam qaranıqdır',
    title: 'İşıq xəttinin bərpası',
    daysFromToday: 1,
    startHour: 19,
    durationMinutes: 120,
    status: IncidentAssigneeTaskStatus.SCHEDULED,
  },
  {
    id: '00000000-0000-4000-8100-000000000033',
    assigneeId: A[3]!.id,
    incidentTitleContains: 'Elektrik dirəyi',
    title: 'Dirəyin möhkəmləndirilməsi',
    daysFromToday: 3,
    startHour: 11,
    durationMinutes: 75,
  },
  {
    id: '00000000-0000-4000-8100-000000000034',
    assigneeId: A[3]!.id,
    incidentTitleContains: 'Həyət işıq dirəkləri',
    title: 'Lampaların dəyişdirilməsi',
    daysFromToday: -2,
    startHour: 17,
    durationMinutes: 60,
  },

  // Azeriqaz
  {
    id: '00000000-0000-4000-8100-000000000041',
    assigneeId: A[4]!.id,
    incidentTitleContains: 'Mətbəxdən qaz iyi',
    title: 'Qaz sızmasının aradan qaldırılması',
    daysFromToday: 0,
    startHour: 9,
    durationMinutes: 150,
    status: IncidentAssigneeTaskStatus.IN_PROGRESS,
  },
  {
    id: '00000000-0000-4000-8100-000000000042',
    assigneeId: A[4]!.id,
    incidentTitleContains: 'Mətbəxdən qaz iyi',
    title: 'Təchizat xəttinin yoxlanması',
    daysFromToday: 1,
    startHour: 8,
    durationMinutes: 90,
  },
  {
    id: '00000000-0000-4000-8100-000000000043',
    assigneeId: A[4]!.id,
    incidentTitleContains: 'Qaz şəbəkəsi planlı',
    title: 'Planlı yoxlama nöqtəsi',
    daysFromToday: 6,
    startHour: 10,
    durationMinutes: 120,
    scheduleType: IncidentAssigneeTaskScheduleType.WINDOW,
  },

  // Leyla Həsənova — fövqəladə / su
  {
    id: '00000000-0000-4000-8100-000000000051',
    assigneeId: A[5]!.id,
    incidentTitleContains: 'Yağış suyu',
    title: 'Drenajın təmizlənməsi',
    daysFromToday: 0,
    startHour: 7,
    durationMinutes: 180,
    status: IncidentAssigneeTaskStatus.IN_PROGRESS,
  },
  {
    id: '00000000-0000-4000-8100-000000000052',
    assigneeId: A[5]!.id,
    incidentTitleContains: 'Su borusunda',
    title: 'Su axınının məhdudlaşdırılması',
    daysFromToday: 1,
    startHour: 8,
    startMinute: 0,
    durationMinutes: 90,
  },
  {
    id: '00000000-0000-4000-8100-000000000053',
    assigneeId: A[5]!.id,
    incidentTitleContains: 'Buz bağlaması',
    title: 'Buzun səpilməsi — pilləkən',
    daysFromToday: -1,
    startHour: 6,
    durationMinutes: 45,
  },
  {
    id: '00000000-0000-4000-8100-000000000054',
    assigneeId: A[5]!.id,
    incidentTitleContains: 'Yağış suyu',
    title: 'Əlavə yoxlama',
    daysFromToday: 4,
    startHour: 12,
    durationMinutes: 60,
  },
  {
    id: '00000000-0000-4000-8100-000000000055',
    assigneeId: A[5]!.id,
    incidentTitleContains: 'Buz bağlaması',
    title: 'Səhər monitorinqi',
    daysFromToday: 2,
    startHour: 6,
    startMinute: 30,
    durationMinutes: 30,
  },
];
