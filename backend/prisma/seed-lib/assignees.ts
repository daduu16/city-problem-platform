import type { PrismaClient } from '@prisma/client';
import { SEED_ASSIGNEES } from '../seed-data/assignees';

export const SEED_ASSIGNEE_MARKER_ID = SEED_ASSIGNEES[0]!.id;

export async function loadCategoryKeyToId(
  prisma: PrismaClient,
): Promise<Map<string, string>> {
  const rows = await prisma.category.findMany({
    select: { id: true, key: true },
  });
  return new Map(rows.map((c) => [c.key, c.id]));
}

export async function seedAssignees(
  prisma: PrismaClient,
  categoryKeyToId: Map<string, string>,
) {
  for (const def of SEED_ASSIGNEES) {
    const categoryIds = def.categoryKeys
      .map((k) => categoryKeyToId.get(k))
      .filter((id): id is string => Boolean(id));
    if (categoryIds.length !== def.categoryKeys.length) {
      console.warn(`Seed assignee "${def.name}": some category keys were not found`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.categoryAssignee.upsert({
        where: { id: def.id },
        update: {
          kind: def.kind,
          name: def.name,
          description: def.description ?? null,
          contactEmail: def.contactEmail ?? null,
          contactPhone: def.contactPhone ?? null,
          organizationId: def.organizationId ?? null,
          isActive: true,
        },
        create: {
          id: def.id,
          kind: def.kind,
          name: def.name,
          description: def.description ?? null,
          contactEmail: def.contactEmail ?? null,
          contactPhone: def.contactPhone ?? null,
          organizationId: def.organizationId ?? null,
          isActive: true,
        },
      });
      await tx.categoryAssigneeCategory.deleteMany({
        where: { assigneeId: def.id },
      });
      if (categoryIds.length > 0) {
        await tx.categoryAssigneeCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            assigneeId: def.id,
            categoryId,
          })),
        });
      }
    });
  }
  return SEED_ASSIGNEES.length;
}
