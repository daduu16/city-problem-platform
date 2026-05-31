import {
  AssigneeAvailabilityKind,
  AssigneeAvailabilitySlotType,
  IncidentAssigneeTaskScheduleType,
  IncidentAssigneeTaskStatus,
  PrismaClient,
} from '@prisma/client';
import {
  addBakuDays,
  bakuLocalToUtc,
  toBakuDateKey,
} from '../../src/assignee-availability/baku-time.util';
import { SEED_ASSIGNEES } from '../seed-data/assignees';
import { SEED_ASSIGNEE_TASKS } from '../seed-data/assignee-tasks';

const SEED_INCIDENT_WHERE = {
  OR: [
    { description: { contains: '[seed:v' } },
    { title: { startsWith: 'Demo:' } },
  ],
};

function taskWindow(def: (typeof SEED_ASSIGNEE_TASKS)[number]) {
  const dateKey = addBakuDays(toBakuDateKey(new Date()), def.daysFromToday);
  const startMin = def.startHour * 60 + (def.startMinute ?? 0);
  const startsAt = bakuLocalToUtc(dateKey, startMin);
  const endsAt = bakuLocalToUtc(dateKey, startMin + def.durationMinutes);
  return { startsAt, endsAt };
}

const DEMO_WEEKLY_LABEL = 'İş saatları (seed)';

/** Mon–Fri 08:00–18:00 Baku for demo assignees. */
async function seedWeeklyAvailability(prisma: PrismaClient) {
  for (const assignee of SEED_ASSIGNEES) {
    await prisma.assigneeAvailabilitySlot.deleteMany({
      where: {
        assigneeId: assignee.id,
        kind: AssigneeAvailabilityKind.WEEKLY,
        label: DEMO_WEEKLY_LABEL,
      },
    });
    await prisma.assigneeAvailabilitySlot.createMany({
      data: [0, 1, 2, 3, 4].map((dayOfWeek) => ({
        assigneeId: assignee.id,
        kind: AssigneeAvailabilityKind.WEEKLY,
        dayOfWeek,
        slotType: AssigneeAvailabilitySlotType.AVAILABLE,
        startMinute: 8 * 60,
        endMinute: 18 * 60,
        label: DEMO_WEEKLY_LABEL,
      })),
    });
  }
}

/**
 * Creates/updates demo assignee tasks on seed incidents (idempotent).
 * Safe to run when demo incidents already exist.
 */
export async function seedAssigneeTasks(
  prisma: PrismaClient,
  createdById: string,
): Promise<number> {
  await seedWeeklyAvailability(prisma);

  const incidents = await prisma.incident.findMany({
    where: SEED_INCIDENT_WHERE,
    select: { id: true, title: true },
  });

  if (incidents.length === 0) {
    console.warn('[seed] No demo incidents found — skipping assignee tasks');
    return 0;
  }

  let upserted = 0;
  for (const def of SEED_ASSIGNEE_TASKS) {
    const incident = incidents.find((i) =>
      i.title.includes(def.incidentTitleContains),
    );
    if (!incident) {
      console.warn(
        `[seed] Assignee task skipped — no incident matching "${def.incidentTitleContains}"`,
      );
      continue;
    }

    const { startsAt, endsAt } = taskWindow(def);
    const scheduleType =
      def.scheduleType ?? IncidentAssigneeTaskScheduleType.FIXED;
    const status = def.status ?? IncidentAssigneeTaskStatus.SCHEDULED;

    await prisma.incidentAssigneeTask.upsert({
      where: { id: def.id },
      create: {
        id: def.id,
        incidentId: incident.id,
        assigneeId: def.assigneeId,
        title: def.title,
        description: def.description ?? null,
        startsAt,
        endsAt,
        scheduleType,
        estimatedMinutes: def.durationMinutes,
        status,
        createdById,
      },
      update: {
        incidentId: incident.id,
        assigneeId: def.assigneeId,
        title: def.title,
        description: def.description ?? null,
        startsAt,
        endsAt,
        scheduleType,
        estimatedMinutes: def.durationMinutes,
        status,
      },
    });
    upserted++;
  }

  return upserted;
}
