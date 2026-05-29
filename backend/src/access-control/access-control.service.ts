import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IncidentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CATEGORY_KEY_TO_LAYER,
  IncidentScopeType,
  UserAccessScope,
} from './access-scope.types';
import { ScopeBuilderService } from './scope-builder.service';
import { ScopeCacheService } from './scope-cache.service';

@Injectable()
export class AccessControlService {
  constructor(
    private scopeBuilder: ScopeBuilderService,
    private scopeCache: ScopeCacheService,
    private prisma: PrismaService,
  ) {}

  async getScope(userId: string): Promise<UserAccessScope> {
    const cached = await this.scopeCache.get(userId);
    if (cached) return cached;

    const scope = await this.scopeBuilder.build(userId);
    if (!scope) throw new NotFoundException('User not found or inactive');

    await this.scopeCache.set(userId, scope);
    return scope;
  }

  async invalidateScope(userId: string): Promise<void> {
    await this.scopeCache.invalidate(userId);
  }

  hasPermission(scope: UserAccessScope, permission: string): boolean {
    if (scope.roleKey === 'super_admin') return true;
    return scope.permissions.includes(permission);
  }

  requirePermission(scope: UserAccessScope, permission: string): void {
    if (!this.hasPermission(scope, permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
  }

  canAccessAnalytics(scope: UserAccessScope, key: string): boolean {
    if (scope.analyticsKeys.includes('*')) return true;
    return scope.analyticsKeys.includes(key);
  }

  canViewLayer(scope: UserAccessScope, layerKey: string): boolean {
    if (scope.mapLayers.includes('*')) return true;
    return scope.mapLayers.includes(layerKey);
  }

  canAccessCategory(scope: UserAccessScope, categoryId: string): boolean {
    if (scope.roleKey === 'super_admin' || scope.categoryIds.length === 0) return true;
    return scope.categoryIds.includes(categoryId);
  }

  async canViewIncident(scope: UserAccessScope, incident: {
    id: string;
    categoryId: string;
    geozoneId?: string | null;
    organizationId?: string | null;
    assignedToId?: string | null;
    createdById?: string;
  }): Promise<boolean> {
    if (scope.roleKey === 'super_admin') return true;

    if (scope.categoryIds.length > 0 && !scope.categoryIds.includes(incident.categoryId)) {
      return false;
    }

    if (
      scope.geozoneIds.length > 0 &&
      incident.geozoneId &&
      !scope.geozoneIds.includes(incident.geozoneId)
    ) {
      return false;
    }

    switch (scope.incidentScope as IncidentScopeType) {
      case 'assigned':
        return incident.assignedToId === scope.userId;
      case 'organization':
        return incident.organizationId === scope.organizationId;
      case 'region':
        if (scope.geozoneIds.length === 0) return true;
        if (!incident.geozoneId) return true;
        return scope.geozoneIds.includes(incident.geozoneId);
      default:
        return true;
    }
  }

  buildIncidentWhere(scope: UserAccessScope, userId?: string): Prisma.IncidentWhereInput {
    if (scope.roleKey === 'super_admin') return {};

    const where: Prisma.IncidentWhereInput = {};

    if (scope.categoryIds.length > 0) {
      where.categoryId = { in: scope.categoryIds };
    }

    if (scope.geozoneIds.length > 0) {
      where.OR = [
        { geozoneId: { in: scope.geozoneIds } },
        // Outside-district incidents have no geozone but stay visible in lists/audit.
        { geozoneId: null },
      ];
    }

    switch (scope.incidentScope as IncidentScopeType) {
      case 'assigned':
        where.assignedToId = userId ?? scope.userId;
        break;
      case 'organization':
        if (scope.organizationId) {
          where.organizationId = scope.organizationId;
        }
        break;
      case 'region':
        break;
      default:
        break;
    }

    return where;
  }

  /** Filter map incidents by allowed layers */
  filterMapIncidentsByLayers<T extends { category: { key: string } }>(
    scope: UserAccessScope,
    incidents: T[],
  ): T[] {
    if (scope.mapLayers.includes('*')) return incidents;

    return incidents.filter((inc) => {
      const layer = CATEGORY_KEY_TO_LAYER[inc.category.key];
      if (!layer) return true;
      return scope.mapLayers.includes(layer);
    });
  }

  /** Analysts exclude archived unless super_admin */
  applyAnalystArchiveFilter(
    scope: UserAccessScope,
    where: Prisma.IncidentWhereInput,
  ): Prisma.IncidentWhereInput {
    if (scope.roleKey === 'analyst') {
      return {
        AND: [where, { status: { not: IncidentStatus.ARCHIVED } }],
      };
    }
    return where;
  }

  getRealtimeRooms(scope: UserAccessScope): string[] {
    const rooms = [`user:${scope.userId}`];
    if (scope.organizationId) rooms.push(`org:${scope.organizationId}`);
    for (const gz of scope.geozoneIds) rooms.push(`geozone:${gz}`);
    for (const cat of scope.categoryIds.slice(0, 20)) rooms.push(`category:${cat}`);
    if (scope.roleKey === 'super_admin') rooms.push('global');
    return rooms;
  }

  getIncidentEmitRooms(incident: {
    organizationId?: string | null;
    geozoneId?: string | null;
    categoryId: string;
  }): string[] {
    const rooms = ['global'];
    if (incident.organizationId) rooms.push(`org:${incident.organizationId}`);
    if (incident.geozoneId) rooms.push(`geozone:${incident.geozoneId}`);
    rooms.push(`category:${incident.categoryId}`);
    return rooms;
  }
}
