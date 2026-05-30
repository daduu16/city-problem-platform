import type { IncidentDetail } from '@/types';
import {
  hasReportMedia,
  normalizeReportMedia,
} from '@/lib/normalizeReportMedia';

type Report = IncidentDetail['reports'][number];
type HistoryItem = IncidentDetail['history'][number];

type HistoryMetadata = { reportId?: string; report_id?: string } | null | undefined;

function parseHistoryMetadata(raw: HistoryItem['metadata']): HistoryMetadata {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as HistoryMetadata;
    } catch {
      return null;
    }
  }
  return raw as HistoryMetadata;
}

export function getHistoryReportId(item: HistoryItem): string | undefined {
  const meta = parseHistoryMetadata(item.metadata);
  return meta?.reportId ?? meta?.report_id;
}

function messagesMatch(reportMessage: string, historyMessage: string): boolean {
  return reportMessage.trim() === historyMessage.trim();
}

/** Resolve citizen report (with media) for a timeline CITIZEN_REPORT entry. */
export function resolveReportForHistoryItem(
  item: HistoryItem,
  reports: Report[],
): Report | undefined {
  if (item.actionType !== 'CITIZEN_REPORT' || reports.length === 0) {
    return undefined;
  }

  const reportId = getHistoryReportId(item);
  let match: Report | undefined;

  if (reportId) {
    match = reports.find((r) => r.id === reportId);
  }

  if (!match && item.newValue) {
    const msg = item.newValue.trim();
    const candidates = reports.filter(
      (r) =>
        messagesMatch(r.message, msg) && r.reporter.id === item.createdBy.id,
    );
    if (candidates.length === 1) {
      match = candidates[0];
    } else if (candidates.length > 1) {
      match = candidates.find((r) => hasReportMedia(r)) ?? candidates[0];
    }
  }

  if (!match || !hasReportMedia(match)) {
    return undefined;
  }

  return { ...match, ...normalizeReportMedia(match) };
}
