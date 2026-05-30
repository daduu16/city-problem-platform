import { HistoryActionType } from '@prisma/client';
import {
  buildLifecycleHistory,
  type LifecycleHistoryEntry,
} from './incident-lifecycle';
import type { CitizenReporterKey } from './demo-reports';
import type { SeededReportGroup } from './demo-report-groups';
import { groupIncidentType, primaryReport } from './group-reports';
import type { DemoOperatorIncident } from './demo-operator-incidents';

export type TimelineActorKey =
  | CitizenReporterKey
  | 'dispatcher'
  | 'executor'
  | 'utility';

export interface TimelineSeedEntry {
  actionType: HistoryActionType;
  oldValue?: string;
  newValue?: string;
  actor: TimelineActorKey;
  offsetMs: number;
}

function lifecycleForOps(ops: SeededReportGroup['ops']): LifecycleHistoryEntry[] {
  const assigneeName = ops.assign
    ? ops.organization === 'azeriqaz'
      ? 'Kamran Azeriqaz'
      : 'Rəşad İcraçı'
    : undefined;

  return buildLifecycleHistory(ops.status, { assigneeName });
}

function statusChangeActor(ops: SeededReportGroup['ops']): TimelineActorKey {
  return ops.organization === 'azeriqaz' ? 'utility' : 'executor';
}

export function buildReportGroupTimelineSeed(
  group: SeededReportGroup,
): TimelineSeedEntry[] {
  const entries: TimelineSeedEntry[] = [];
  const reports = [...group.reports].sort((a, b) => a.daysAgo - b.daysAgo);
  const reportCount = reports.length;

  const earliestDaysAgo = reports[0]?.daysAgo ?? 0;
  const preWindowMs =
    reportCount > 0
      ? Math.min(
          earliestDaysAgo === 0 ? 20 * 3600000 : 96 * 3600000,
          Math.max(8 * 3600000, reportCount * 5 * 3600000),
        )
      : 0;

  reports.forEach((report, index) => {
    const spread =
      reportCount <= 1 ? 0 : (preWindowMs * index) / (reportCount - 1);
    entries.push({
      actionType: HistoryActionType.CITIZEN_REPORT,
      newValue: report.message,
      actor: report.reporterKey,
      offsetMs: -preWindowMs + spread + index * 45 * 60_000,
    });
  });

  const lifecycle = lifecycleForOps(group.ops);
  let opsOffset = reportCount > 0 ? 2 * 3600000 : 0;
  const opStepMs = 5 * 3600000;

  for (const step of lifecycle) {
    let actor: TimelineActorKey = 'dispatcher';
    if (step.actionType === HistoryActionType.STATUS_CHANGED) {
      actor = statusChangeActor(group.ops);
    }

    entries.push({
      actionType: step.actionType,
      oldValue: step.oldValue,
      newValue: step.newValue,
      actor,
      offsetMs: opsOffset,
    });
    opsOffset += opStepMs;
  }

  if (group.ops.comments?.length) {
    group.ops.comments.forEach((body, index) => {
      entries.push({
        actionType: HistoryActionType.COMMENT,
        newValue: body,
        actor: index % 2 === 0 ? statusChangeActor(group.ops) : 'dispatcher',
        offsetMs: opsOffset + index * 3 * 3600000,
      });
    });
  }

  return entries.sort((a, b) => a.offsetMs - b.offsetMs);
}

export function buildOperatorIncidentTimelineSeed(
  demo: DemoOperatorIncident,
): TimelineSeedEntry[] {
  const entries: TimelineSeedEntry[] = [];

  if (demo.lateReports?.length) {
    const sorted = [...demo.lateReports].sort((a, b) => b.daysAgo - a.daysAgo);
    sorted.forEach((report, index) => {
      entries.push({
        actionType: HistoryActionType.CITIZEN_REPORT,
        newValue: report.message,
        actor: report.reporterKey,
        offsetMs: (demo.daysAgo - report.daysAgo) * 24 * 3600000 + index * 3600000,
      });
    });
  }

  const assigneeName = demo.assign
    ? demo.organization === 'azeriqaz'
      ? 'Kamran Azeriqaz'
      : 'Rəşad İcraçı'
    : undefined;

  const lifecycle = buildLifecycleHistory(demo.status, { assigneeName });
  let opsOffset = demo.lateReports?.length ? 4 * 3600000 : 0;
  const opStepMs = 5 * 3600000;
  const actorForStatus =
    demo.organization === 'azeriqaz' ? 'utility' : 'executor';

  for (const step of lifecycle) {
    let actor: TimelineActorKey = 'dispatcher';
    if (step.actionType === HistoryActionType.STATUS_CHANGED) {
      actor = actorForStatus;
    }

    entries.push({
      actionType: step.actionType,
      oldValue: step.oldValue,
      newValue: step.newValue,
      actor,
      offsetMs: opsOffset,
    });
    opsOffset += opStepMs;
  }

  if (demo.comments?.length) {
    demo.comments.forEach((body, index) => {
      entries.push({
        actionType: HistoryActionType.COMMENT,
        newValue: body,
        actor: index % 2 === 0 ? actorForStatus : 'dispatcher',
        offsetMs: opsOffset + index * 3 * 3600000,
      });
    });
  }

  return entries.sort((a, b) => a.offsetMs - b.offsetMs);
}

export function reportGroupTitle(group: SeededReportGroup): string {
  return primaryReport(group).title;
}

export function reportGroupType(group: SeededReportGroup) {
  return groupIncidentType(group);
}
