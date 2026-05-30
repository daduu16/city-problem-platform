import {
  DistrictStatus,
  IncidentPriority,
  IncidentStatus,
  PrismaClient,
} from '@prisma/client';
import {
  centroidFromCoordinates,
  isSameIncidentTopic,
  isSameIncidentType,
  isWithinMergeRadius,
} from '../../src/incidents/incident-proximity';

const OPEN_STATUSES: IncidentStatus[] = [
  IncidentStatus.NEW,
  IncidentStatus.IN_PROGRESS,
  IncidentStatus.PENDING,
  IncidentStatus.OVERDUE,
];

const PRIORITY_RANK: Record<IncidentPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

/**
 * Merges duplicate open incidents in the DB (same rules as runtime citizen report merge).
 * Keeps the oldest incident; moves reports, comments, history, attachments; deletes duplicate.
 */
export async function mergeDuplicateOpenIncidents(
  prisma: PrismaClient,
): Promise<number> {
  const incidents = await prisma.incident.findMany({
    where: {
      status: { in: OPEN_STATUSES },
      districtStatus: DistrictStatus.WITHIN_DISTRICT,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      categoryId: true,
      subcategoryId: true,
      lat: true,
      lng: true,
      createdAt: true,
      priority: true,
    },
  });

  const removed = new Set<string>();
  let mergeCount = 0;

  for (let i = 0; i < incidents.length; i++) {
    const keeper = incidents[i];
    if (removed.has(keeper.id)) continue;

    for (let j = i + 1; j < incidents.length; j++) {
      const dup = incidents[j];
      if (removed.has(dup.id)) continue;

      if (
        !isSameIncidentType(
          keeper.categoryId,
          keeper.subcategoryId,
          dup.categoryId,
          dup.subcategoryId,
        )
      ) {
        continue;
      }
      if (!isSameIncidentTopic(keeper.title, dup.title)) continue;
      if (!isWithinMergeRadius(keeper.lat, keeper.lng, dup.lat, dup.lng)) {
        continue;
      }
      await prisma.$transaction([
        prisma.incidentReport.updateMany({
          where: { incidentId: dup.id },
          data: { incidentId: keeper.id },
        }),
        prisma.incidentComment.updateMany({
          where: { incidentId: dup.id },
          data: { incidentId: keeper.id },
        }),
        prisma.incidentHistory.updateMany({
          where: { incidentId: dup.id },
          data: { incidentId: keeper.id },
        }),
        prisma.attachment.updateMany({
          where: { incidentId: dup.id },
          data: { incidentId: keeper.id },
        }),
        prisma.incident.delete({ where: { id: dup.id } }),
      ]);

      removed.add(dup.id);
      mergeCount++;

      if (PRIORITY_RANK[dup.priority] > PRIORITY_RANK[keeper.priority]) {
        await prisma.incident.update({
          where: { id: keeper.id },
          data: { priority: dup.priority },
        });
        keeper.priority = dup.priority;
      }

      const reports = await prisma.incidentReport.findMany({
        where: { incidentId: keeper.id },
        select: { lat: true, lng: true },
      });
      const centroid = centroidFromCoordinates(reports);
      if (centroid) {
        await prisma.incident.update({
          where: { id: keeper.id },
          data: { lat: centroid.lat, lng: centroid.lng },
        });
      }
    }
  }

  return mergeCount;
}
