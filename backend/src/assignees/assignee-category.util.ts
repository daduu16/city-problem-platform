import { BadRequestException } from '@nestjs/common';

type CategoryRow = { id: string; parentId: string | null };

/** Expand parent category picks to leaf subcategory ids for linking. */
export function resolveLeafCategoryIds(
  all: CategoryRow[],
  categoryIds: string[],
): string[] {
  if (categoryIds.length === 0) return [];

  const byId = new Map(all.map((c) => [c.id, c]));
  const invalid = categoryIds.filter((id) => !byId.has(id));
  if (invalid.length > 0) {
    throw new BadRequestException('One or more categories are invalid');
  }

  const childrenByParent = new Map<string, string[]>();
  for (const c of all) {
    if (!c.parentId) continue;
    const list = childrenByParent.get(c.parentId) ?? [];
    list.push(c.id);
    childrenByParent.set(c.parentId, list);
  }

  const hasChild = new Set(childrenByParent.keys());
  const isLeaf = (id: string) => {
    const row = byId.get(id);
    return row != null && row.parentId != null && !hasChild.has(id);
  };

  const out = new Set<string>();

  const collectLeaves = (id: string) => {
    if (isLeaf(id)) {
      out.add(id);
      return;
    }
    const children = childrenByParent.get(id) ?? [];
    for (const childId of children) collectLeaves(childId);
  };

  for (const id of categoryIds) collectLeaves(id);

  return [...out];
}
