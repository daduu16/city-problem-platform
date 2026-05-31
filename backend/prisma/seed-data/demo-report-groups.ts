import {
  DistrictStatus,
  IncidentPriority,
  IncidentStatus,
} from '@prisma/client';
import type { ReportGroup } from './group-reports';
import { primaryReport } from './group-reports';
import { bundleOpsByTitle, DEMO_CITIZEN_INCIDENT_BUNDLES } from './demo-40-incidents';
import { SEED_DESCRIPTION_TAG } from './demo-reports';

export type ReportGroupOps = {
  status: IncidentStatus;
  priority: IncidentPriority;
  assign?: boolean;
  organization?: 'municipality' | 'azeriqaz';
  districtStatus?: DistrictStatus;
  comments?: string[];
};

export type SeededReportGroup = ReportGroup & { ops: ReportGroupOps };

const DEFAULT_OPS: ReportGroupOps = {
  status: IncidentStatus.NEW,
  priority: IncidentPriority.MEDIUM,
};

const BUNDLE_OPS_BY_TITLE = bundleOpsByTitle(DEMO_CITIZEN_INCIDENT_BUNDLES);

function opsForGroup(group: ReportGroup): ReportGroupOps {
  const p = primaryReport(group);
  const explicit = BUNDLE_OPS_BY_TITLE.get(p.title);
  if (explicit) {
    return { ...DEFAULT_OPS, ...explicit };
  }

  if (p.categoryKey === 'water' && p.title.includes('partlayış')) {
    return {
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.CRITICAL,
      assign: true,
      comments: ['Azersu briqadası yoldadır.', 'Boru əvəz olunur.'],
    };
  }
  if (p.categoryKey === 'gas') {
    return {
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.CRITICAL,
      assign: true,
      organization: 'azeriqaz',
    };
  }
  if (p.categoryKey === 'road_surface') {
    return {
      status: IncidentStatus.PENDING,
      priority: IncidentPriority.HIGH,
      assign: true,
      comments: ['Material çatdırılması gözlənilir.'],
    };
  }
  if (p.categoryKey === 'broken_lamps') {
    return { status: IncidentStatus.NEW, priority: IncidentPriority.MEDIUM };
  }
  if (p.categoryKey === 'floods') {
    return {
      status: IncidentStatus.IN_PROGRESS,
      priority: IncidentPriority.HIGH,
      assign: true,
    };
  }
  if (p.daysAgo >= 12) {
    return {
      status: IncidentStatus.ARCHIVED,
      priority: IncidentPriority.LOW,
    };
  }
  if (p.daysAgo >= 7) {
    return {
      status: IncidentStatus.RESOLVED,
      priority: IncidentPriority.MEDIUM,
    };
  }

  return DEFAULT_OPS;
}

export function attachOpsToGroups(groups: ReportGroup[]): SeededReportGroup[] {
  return groups.map((group) => ({
    ...group,
    ops: opsForGroup(group),
  }));
}

export function groupDescription(group: ReportGroup): string {
  const messages = group.reports.map((r) => r.message).join(' ');
  const body =
    messages.length > 400 ? `${messages.slice(0, 397)}…` : messages;
  return `${body}${SEED_DESCRIPTION_TAG}`;
}
