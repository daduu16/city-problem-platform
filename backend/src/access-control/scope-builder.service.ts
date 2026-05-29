import { Injectable } from '@nestjs/common';
import { IncidentScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentScopeType, UserAccessScope } from './access-scope.types';

@Injectable()
export class ScopeBuilderService {
  constructor(private prisma: PrismaService) {}

  private mapIncidentScope(scope: IncidentScope): IncidentScopeType {
    switch (scope) {
      case IncidentScope.ASSIGNED:
        return 'assigned';
      case IncidentScope.REGION:
        return 'region';
      case IncidentScope.ORGANIZATION:
        return 'organization';
      default:
        return 'all';
    }
  }

  private async resolveCategoryDescendants(categoryIds: string[]): Promise<string[]> {
    if (categoryIds.length === 0) return [];

    const all = await this.prisma.category.findMany({
      select: { id: true, parentId: true },
    });

    const childrenMap = new Map<string, string[]>();
    for (const cat of all) {
      if (cat.parentId) {
        const siblings = childrenMap.get(cat.parentId) ?? [];
        siblings.push(cat.id);
        childrenMap.set(cat.parentId, siblings);
      }
    }

    const result = new Set<string>();
    const stack = [...categoryIds];
    while (stack.length) {
      const id = stack.pop()!;
      if (result.has(id)) continue;
      result.add(id);
      for (const childId of childrenMap.get(id) ?? []) {
        stack.push(childId);
      }
    }
    return [...result];
  }

  async build(userId: string): Promise<UserAccessScope | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
        categoryAccess: { include: { category: true } },
        geozoneAccess: true,
        mapLayerAccess: true,
        analyticsAccess: true,
      },
    });

    if (!user?.isActive || !user.role) return null;

    const directCategoryIds = user.categoryAccess.map((a) => a.categoryId);
    const categoryIds = await this.resolveCategoryDescendants(directCategoryIds);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, key: true },
    });

    let geozoneIds = user.geozoneAccess.map((a) => a.geozoneId);
    if (geozoneIds.length === 0 && user.defaultGeozoneId) {
      geozoneIds = [user.defaultGeozoneId];
    }

    const isSuperAdmin = user.role.key === 'super_admin';

    return {
      userId: user.id,
      roleKey: user.role.key,
      roleId: user.role.id,
      organizationId: user.organizationId,
      permissions: user.role.permissions.map((rp) => rp.permission.key),
      categoryIds: isSuperAdmin ? [] : categoryIds,
      categoryKeys: isSuperAdmin ? ['*'] : categories.map((c) => c.key),
      geozoneIds: isSuperAdmin ? [] : geozoneIds,
      mapLayers: isSuperAdmin
        ? ['*']
        : user.mapLayerAccess.map((a) => a.layerKey),
      analyticsKeys: isSuperAdmin
        ? ['*']
        : user.analyticsAccess.map((a) => a.analyticsKey),
      incidentScope: this.mapIncidentScope(user.role.incidentScope),
    };
  }
}
