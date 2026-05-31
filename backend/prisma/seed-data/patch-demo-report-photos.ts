import type { PrismaClient } from '@prisma/client';
import { DEMO_REPORT_PHOTOS } from './demo-report-assets';

type ReportPatch = {
  incidentTitle: string;
  messageIncludes: string;
  photoUrl: string;
  message?: string;
};

const REPORT_PATCHES: ReportPatch[] = [
  {
    incidentTitle: 'Su borusunda partlayış',
    messageIncludes: 'partlayış səsi',
    photoUrl: DEMO_REPORT_PHOTOS.burst,
    message:
      'Səhər 7-də partlayış səsi — küçədə güclü su axını, foto əlavə etdim.',
  },
  {
    incidentTitle: 'Su borusunda partlayış',
    messageIncludes: 'Giriş qapısı',
    photoUrl: DEMO_REPORT_PHOTOS.entrance,
    message:
      'Giriş qapısı və pilləkən tam su altındadır, lift işləmir (foto).',
  },
  {
    incidentTitle: 'Su borusunda partlayış',
    messageIncludes: 'sızıntı',
    photoUrl: DEMO_REPORT_PHOTOS.corridor,
    message:
      'Mərtəbələrarası pilləkəndə su birikintisi — dünən də sızıntı var idi.',
  },
  {
    incidentTitle: 'Yağış suyu küçəni basır',
    messageIncludes: 'Drenaj',
    photoUrl: DEMO_REPORT_PHOTOS.burst,
    message: 'Drenaj tıxılıb, küçə su altındadır — axın güclüdür (foto).',
  },
  {
    incidentTitle: 'Fasad üzərində çatlar',
    messageIncludes: 'Çatdan',
    photoUrl: DEMO_REPORT_PHOTOS.leakWall,
    message: 'Çatdan və borudan su sızır, divar islanıb (foto sübut).',
  },
];

/** Updates existing demo incidents to use local /uploads/demo photos (idempotent). */
export async function patchDemoReportPhotos(prisma: PrismaClient) {
  for (const patch of REPORT_PATCHES) {
    const incident = await prisma.incident.findFirst({
      where: { title: patch.incidentTitle },
      include: { reports: true },
    });
    if (!incident) continue;

    const report = incident.reports.find((r) =>
      r.message.includes(patch.messageIncludes),
    );
    if (!report) continue;

    if (
      report.photoUrl === patch.photoUrl &&
      (!patch.message || report.message === patch.message)
    ) {
      continue;
    }

    await prisma.incidentReport.update({
      where: { id: report.id },
      data: {
        photoUrl: patch.photoUrl,
        ...(patch.message ? { message: patch.message } : {}),
      },
    });
  }
}
