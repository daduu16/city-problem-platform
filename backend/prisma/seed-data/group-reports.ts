import { IncidentType } from '@prisma/client';
import {
  INCIDENT_MERGE_RADIUS_M,
  centroidFromCoordinates,
  haversineMeters,
  isSameIncidentTopic,
} from '../../src/incidents/incident-proximity';
import type { DemoReportSeed } from './demo-reports';

export type ReportGroup = {
  reports: DemoReportSeed[];
  centroid: { lat: number; lng: number };
};

function isSameReportGroup(a: DemoReportSeed, b: DemoReportSeed): boolean {
  if (a.categoryKey !== b.categoryKey) return false;
  if ((a.subcategoryKey ?? null) !== (b.subcategoryKey ?? null)) return false;
  if (!isSameIncidentTopic(a.title, b.title)) return false;
  return haversineMeters(a.lat, a.lng, b.lat, b.lng) <= INCIDENT_MERGE_RADIUS_M;
}

/** Groups citizen reports into incident clusters (same rules as runtime merge). */
export function groupReports(reports: DemoReportSeed[]): ReportGroup[] {
  const groups: ReportGroup[] = [];

  for (const report of reports) {
    const match = groups.find((g) =>
      g.reports.some((existing) => isSameReportGroup(existing, report)),
    );

    if (!match) {
      groups.push({
        reports: [report],
        centroid: { lat: report.lat, lng: report.lng },
      });
      continue;
    }

    match.reports.push(report);
    const centroid = centroidFromCoordinates(match.reports);
    if (centroid) match.centroid = centroid;
  }

  return groups;
}

export function primaryReport(group: ReportGroup): DemoReportSeed {
  return [...group.reports].sort((a, b) => a.daysAgo - b.daysAgo)[0];
}

export function groupIncidentType(group: ReportGroup): IncidentType {
  return group.reports.find((r) => r.type)?.type ?? IncidentType.COMPLAINT;
}
