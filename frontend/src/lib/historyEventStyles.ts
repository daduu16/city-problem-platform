import type { IncidentStatus } from '@/types';
import { getStatusStyle } from '@/lib/incidentStyles';

export type HistoryActionType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNED'
  | 'COMMENT'
  | 'CITIZEN_REPORT'
  | 'ATTACHMENT_ADDED'
  | 'DEADLINE_CHANGED'
  | 'UPDATED';

export interface HistoryEventStyle {
  dotColor: string;
  lineColor: string;
  cardBg: string;
  cardBorder: string;
  titleColor: string;
}

const CITIZEN: HistoryEventStyle = {
  dotColor: '#f59e0b',
  lineColor: 'rgba(245, 158, 11, 0.45)',
  cardBg: 'rgba(245, 158, 11, 0.12)',
  cardBorder: 'rgba(245, 158, 11, 0.35)',
  titleColor: '#fbbf24',
};

const DISPATCH: HistoryEventStyle = {
  dotColor: '#38bdf8',
  lineColor: 'rgba(56, 189, 248, 0.4)',
  cardBg: 'rgba(56, 189, 248, 0.1)',
  cardBorder: 'rgba(56, 189, 248, 0.3)',
  titleColor: '#7dd3fc',
};

const ASSIGN: HistoryEventStyle = {
  dotColor: '#a78bfa',
  lineColor: 'rgba(167, 139, 250, 0.4)',
  cardBg: 'rgba(167, 139, 250, 0.1)',
  cardBorder: 'rgba(167, 139, 250, 0.32)',
  titleColor: '#c4b5fd',
};

const COMMENT: HistoryEventStyle = {
  dotColor: '#94a3b8',
  lineColor: 'rgba(148, 163, 184, 0.35)',
  cardBg: 'rgba(148, 163, 184, 0.08)',
  cardBorder: 'rgba(148, 163, 184, 0.25)',
  titleColor: '#cbd5e1',
};

const PRIORITY: HistoryEventStyle = {
  dotColor: '#fb923c',
  lineColor: 'rgba(251, 146, 60, 0.4)',
  cardBg: 'rgba(251, 146, 60, 0.1)',
  cardBorder: 'rgba(251, 146, 60, 0.3)',
  titleColor: '#fdba74',
};

const DEFAULT: HistoryEventStyle = {
  dotColor: '#64748b',
  lineColor: 'rgba(100, 116, 139, 0.35)',
  cardBg: 'rgba(100, 116, 139, 0.08)',
  cardBorder: 'rgba(100, 116, 139, 0.22)',
  titleColor: '#94a3b8',
};

function statusStyle(status: string): HistoryEventStyle {
  const s = getStatusStyle(status as IncidentStatus);
  return {
    dotColor: s.color,
    lineColor: s.bg,
    cardBg: s.bg,
    cardBorder: s.border,
    titleColor: s.color,
  };
}

export function getHistoryEventStyle(
  actionType: string,
  newValue?: string | null,
): HistoryEventStyle {
  switch (actionType) {
    case 'CITIZEN_REPORT':
      return CITIZEN;
    case 'CREATED':
      return DISPATCH;
    case 'ASSIGNED':
      return ASSIGN;
    case 'COMMENT':
      return COMMENT;
    case 'PRIORITY_CHANGED':
      return PRIORITY;
    case 'STATUS_CHANGED':
      if (newValue) return statusStyle(newValue);
      return DISPATCH;
    default:
      return DEFAULT;
  }
}
