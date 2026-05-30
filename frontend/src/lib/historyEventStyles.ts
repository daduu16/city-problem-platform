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
  iconColor: string;
}

const CITIZEN: HistoryEventStyle = {
  dotColor: '#faad14',
  lineColor: 'rgba(250, 173, 20, 0.35)',
  cardBg: 'rgba(250, 173, 20, 0.08)',
  cardBorder: 'rgba(250, 173, 20, 0.28)',
  titleColor: '#874d00',
  iconColor: '#ad6800',
};

const DISPATCH: HistoryEventStyle = {
  dotColor: '#5d5fef',
  lineColor: 'rgba(93, 95, 239, 0.3)',
  cardBg: 'rgba(93, 95, 239, 0.07)',
  cardBorder: 'rgba(93, 95, 239, 0.22)',
  titleColor: '#3538b8',
  iconColor: '#5d5fef',
};

const ASSIGN: HistoryEventStyle = {
  dotColor: '#9254de',
  lineColor: 'rgba(146, 84, 222, 0.3)',
  cardBg: 'rgba(146, 84, 222, 0.07)',
  cardBorder: 'rgba(146, 84, 222, 0.22)',
  titleColor: '#531dab',
  iconColor: '#9254de',
};

const COMMENT: HistoryEventStyle = {
  dotColor: '#8c8c8c',
  lineColor: 'rgba(140, 140, 140, 0.28)',
  cardBg: 'rgba(140, 140, 140, 0.06)',
  cardBorder: 'rgba(140, 140, 140, 0.2)',
  titleColor: '#434343',
  iconColor: '#595959',
};

const PRIORITY: HistoryEventStyle = {
  dotColor: '#fa8c16',
  lineColor: 'rgba(250, 140, 22, 0.32)',
  cardBg: 'rgba(250, 140, 22, 0.08)',
  cardBorder: 'rgba(250, 140, 22, 0.26)',
  titleColor: '#ad4e00',
  iconColor: '#d46b08',
};

const DEFAULT: HistoryEventStyle = {
  dotColor: '#8c8c8c',
  lineColor: 'rgba(140, 140, 140, 0.28)',
  cardBg: 'rgba(140, 140, 140, 0.06)',
  cardBorder: 'rgba(140, 140, 140, 0.2)',
  titleColor: '#434343',
  iconColor: '#595959',
};

function statusStyle(status: string): HistoryEventStyle {
  const s = getStatusStyle(status as IncidentStatus);
  return {
    dotColor: s.color,
    lineColor: s.bg,
    cardBg: s.bg,
    cardBorder: `${s.border}55`,
    titleColor: s.color,
    iconColor: s.color,
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
