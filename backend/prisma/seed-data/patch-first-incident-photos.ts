import type { PrismaClient } from '@prisma/client';
import {
  DEMO_REPORT_PHOTO_URL,
  DEMO_REPORT_PHOTO_URL_2,
} from './demo-reports';

const FIRST_INCIDENT_TITLE = 'Su borusunda partlayış';

/** Ensures the demo water incident has two distinct report photos (idempotent). */
export async function patchFirstIncidentDemoPhotos(prisma: PrismaClient) {
  const incident = await prisma.incident.findFirst({
    where: { title: FIRST_INCIDENT_TITLE },
    include: {
      reports: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!incident) return;

  const photoReports = incident.reports.filter((r) => r.photoUrl?.trim());
  const distinctUrls = new Set(photoReports.map((r) => r.photoUrl!.trim()));
  if (distinctUrls.size >= 2) return;

  for (const report of incident.reports) {
    if (report.message.includes('Giriş qapısı')) {
      await prisma.incidentReport.update({
        where: { id: report.id },
        data: { photoUrl: DEMO_REPORT_PHOTO_URL_2 },
      });
      continue;
    }
    if (report.message.includes('Dünən də sızıntı')) {
      await prisma.incidentReport.update({
        where: { id: report.id },
        data: { photoUrl: DEMO_REPORT_PHOTO_URL },
      });
    }
  }
}
