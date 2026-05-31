import { getApiBaseUrl } from '@/config/api';
import type { MobileAssigneeProfile, MobileScheduleCalendar } from '@/types';

async function authFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      if (json?.message) {
        message = Array.isArray(json.message) ? json.message.join(', ') : json.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchAssigneeProfile(
  token: string,
): Promise<MobileAssigneeProfile | null> {
  return authFetch<MobileAssigneeProfile | null>('/assignees/schedule-profile', token);
}

export async function fetchAssigneeCalendar(
  token: string,
  assigneeId: string,
  from: string,
  to: string,
): Promise<MobileScheduleCalendar> {
  const params = new URLSearchParams({ from, to });
  return authFetch<MobileScheduleCalendar>(
    `/assignees/${assigneeId}/availability/calendar?${params.toString()}`,
    token,
  );
}
