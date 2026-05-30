import { HistoryActionType, IncidentStatus } from '@prisma/client';

export type LifecycleHistoryEntry = {
  actionType: HistoryActionType;
  oldValue?: string;
  newValue?: string;
};

/** Status progression from creation through the incident's final state. */
function statusPath(finalStatus: IncidentStatus): IncidentStatus[] {
  switch (finalStatus) {
    case IncidentStatus.NEW:
      return [IncidentStatus.NEW];
    case IncidentStatus.IN_PROGRESS:
      return [IncidentStatus.NEW, IncidentStatus.IN_PROGRESS];
    case IncidentStatus.PENDING:
      return [
        IncidentStatus.NEW,
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.PENDING,
      ];
    case IncidentStatus.OVERDUE:
      return [
        IncidentStatus.NEW,
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.OVERDUE,
      ];
    case IncidentStatus.RESOLVED:
      return [
        IncidentStatus.NEW,
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.RESOLVED,
      ];
    case IncidentStatus.ARCHIVED:
      return [
        IncidentStatus.NEW,
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.RESOLVED,
        IncidentStatus.ARCHIVED,
      ];
    default:
      return [IncidentStatus.NEW];
  }
}

/** Full interaction timeline through resolution / archive. */
export function buildLifecycleHistory(
  finalStatus: IncidentStatus,
  options?: { assigneeName?: string },
): LifecycleHistoryEntry[] {
  const path = statusPath(finalStatus);
  const entries: LifecycleHistoryEntry[] = [
    { actionType: HistoryActionType.CREATED, newValue: IncidentStatus.NEW },
  ];

  for (let i = 1; i < path.length; i++) {
    entries.push({
      actionType: HistoryActionType.STATUS_CHANGED,
      oldValue: path[i - 1],
      newValue: path[i],
    });
  }

  if (
    options?.assigneeName &&
    finalStatus !== IncidentStatus.NEW &&
    finalStatus !== IncidentStatus.ARCHIVED
  ) {
    entries.splice(1, 0, {
      actionType: HistoryActionType.ASSIGNED,
      newValue: options.assigneeName,
    });
  }

  return entries;
}
