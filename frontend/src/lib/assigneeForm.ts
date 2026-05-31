import type { Category, CategoryAssigneeKind } from '@/types';

export type AssigneeFormValues = {
  kind: CategoryAssigneeKind;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  organizationId: string;
  isActive: boolean;
};

export function resolveLeafCategoryIds(
  categories: Category[],
  ids: string[],
): string[] {
  const hasChild = new Set(
    categories
      .filter((c) => categories.some((p) => p.parentId === c.id))
      .map((c) => c.id),
  );
  return ids.filter((id) => {
    const cat = categories.find((c) => c.id === id);
    return cat != null && cat.parentId != null && !hasChild.has(id);
  });
}

export function buildAssigneePayload(
  form: AssigneeFormValues,
  categoryIds: string[],
) {
  const trim = (s: string) => s.trim();
  const email = trim(form.contactEmail);
  const phone = trim(form.contactPhone);
  const description = trim(form.description);
  const orgId = trim(form.organizationId);

  return {
    kind: form.kind,
    name: trim(form.name),
    isActive: form.isActive,
    categoryIds,
    ...(description ? { description } : {}),
    ...(email ? { contactEmail: email } : {}),
    ...(phone ? { contactPhone: phone } : {}),
    ...(orgId ? { organizationId: orgId } : {}),
  };
}

export function formatAssigneeApiError(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const raw = err.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw.trim()) return raw;
  return '';
}
