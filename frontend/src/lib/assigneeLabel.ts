import type { CategoryAssignee } from '@/types';

/** Disambiguate assignees in dropdowns (demo login vs executor profile). */
export function formatAssigneeLabel(
  assignee: Pick<CategoryAssignee, 'name' | 'contactEmail' | 'kind'>,
): string {
  const email = assignee.contactEmail?.trim();
  if (email) {
    return `${assignee.name} · ${email}`;
  }
  return assignee.name;
}
