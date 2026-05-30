import { ForbiddenException, Injectable } from '@nestjs/common';
import { IncidentPriority, IncidentStatus, Prisma } from '@prisma/client';
import { AccessControlService } from '../access-control/access-control.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { DistrictZoneId, DISTRICT_ZONE_ORDER } from '../districts/district-zones.util';
import { DistrictZonesService } from '../districts/district-zones.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private accessControl: AccessControlService,
    private districtZones: DistrictZonesService,
  ) {}

  private async scopedWhere(user: JwtPayload): Promise<Prisma.IncidentWhereInput> {
    const scope = await this.accessControl.getScope(user.sub);
    let where = this.accessControl.buildIncidentWhere(scope, user.sub);
    return this.accessControl.applyAnalystArchiveFilter(scope, where);
  }

  private requireAnalytics(scope: Awaited<ReturnType<AccessControlService['getScope']>>, key: string) {
    if (!this.accessControl.canAccessAnalytics(scope, key)) {
      throw new ForbiddenException(`Analytics not allowed: ${key}`);
    }
  }

  async getDashboardKpis(user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'kpis');

    const baseWhere = await this.scopedWhere(user);
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const activeWhere: Prisma.IncidentWhereInput = {
      AND: [
        baseWhere,
        { status: { in: [IncidentStatus.NEW, IncidentStatus.IN_PROGRESS, IncidentStatus.PENDING] } },
      ],
    };

    const openWhere: Prisma.IncidentWhereInput = {
      AND: [
        baseWhere,
        { status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.ARCHIVED] } },
      ],
    };

    const [
      activeCount,
      overdueCount,
      newTodayCount,
      resolvedCount,
      resolvedTodayCount,
      criticalCount,
      totalOpen,
      priorityGroups,
    ] = await Promise.all([
      this.prisma.incident.count({ where: activeWhere }),
      this.prisma.incident.count({
        where: { AND: [baseWhere, { status: IncidentStatus.OVERDUE }] },
      }),
      this.prisma.incident.count({
        where: { AND: [baseWhere, { createdAt: { gte: startOfDay } }] },
      }),
      this.prisma.incident.count({
        where: { AND: [baseWhere, { status: IncidentStatus.RESOLVED }] },
      }),
      this.prisma.incident.count({
        where: {
          AND: [
            baseWhere,
            { status: IncidentStatus.RESOLVED, resolvedAt: { gte: startOfDay } },
          ],
        },
      }),
      this.prisma.incident.count({
        where: {
          AND: [baseWhere, { priority: 'CRITICAL', status: { not: IncidentStatus.RESOLVED } }],
        },
      }),
      this.prisma.incident.count({ where: openWhere }),
      this.prisma.incident.groupBy({
        by: ['priority'],
        _count: { id: true },
        where: openWhere,
      }),
    ]);

    const priorityOpen: Record<IncidentPriority, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    for (const g of priorityGroups) {
      priorityOpen[g.priority] = g._count.id;
    }

    const resolvedWithTime = await this.prisma.incident.findMany({
      where: { AND: [baseWhere, { resolvedAt: { not: null } }] },
      select: { createdAt: true, resolvedAt: true },
      take: 500,
    });

    let avgResolutionHours = 0;
    if (resolvedWithTime.length > 0) {
      const totalMs = resolvedWithTime.reduce(
        (sum, i) => sum + (i.resolvedAt!.getTime() - i.createdAt.getTime()),
        0,
      );
      avgResolutionHours = Math.round(totalMs / resolvedWithTime.length / 3600000);
    }

    const resolvedWithSla = await this.prisma.incident.findMany({
      where: {
        AND: [
          baseWhere,
          { status: IncidentStatus.RESOLVED, resolvedAt: { not: null }, slaDueAt: { not: null } },
        ],
      },
      select: { resolvedAt: true, slaDueAt: true },
    });
    const slaMet = resolvedWithSla.filter((r) => r.resolvedAt! <= r.slaDueAt!).length;
    const slaTotal = resolvedWithSla.length || 1;
    const slaPercent = resolvedWithSla.length
      ? Math.round((slaMet / slaTotal) * 100)
      : 100;

    const resolutionRate =
      resolvedCount + totalOpen > 0
        ? Math.round((resolvedCount / (resolvedCount + totalOpen)) * 100)
        : 100;

    const overdueRatio = totalOpen > 0 ? overdueCount / totalOpen : 0;
    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          slaPercent * 0.35 +
            resolutionRate * 0.25 +
            (100 - overdueRatio * 100) * 0.2 +
            (100 - Math.min(100, criticalCount * 8)) * 0.2,
        ),
      ),
    );

    return {
      activeProblems: activeCount,
      overdueTasks: overdueCount,
      newToday: newTodayCount,
      resolvedToday: resolvedTodayCount,
      avgResolutionHours,
      accidentsCount: criticalCount,
      slaPercent: Math.min(slaPercent, 100),
      totalOpen,
      resolutionRate,
      healthScore,
      priorityOpen,
    };
  }

  async getByCategory(user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'by_category');

    const baseWhere = await this.scopedWhere(user);
    const groups = await this.prisma.incident.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      where: {
        AND: [baseWhere, { status: { not: IncidentStatus.ARCHIVED } }],
      },
    });

    const categories = await this.prisma.category.findMany({
      where: { id: { in: groups.map((g) => g.categoryId) } },
      select: { id: true, key: true, name: true },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    return groups.map((g) => ({
      categoryId: g.categoryId,
      category: catMap[g.categoryId],
      count: g._count.id,
    }));
  }

  async getByStatus(user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'by_status');

    const baseWhere = await this.scopedWhere(user);
    const groups = await this.prisma.incident.groupBy({
      by: ['status'],
      _count: { id: true },
      where: baseWhere,
    });
    return groups.map((g) => ({ status: g.status, count: g._count.id }));
  }

  async getTimeline(user: JwtPayload, days = 7) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'timeline');

    const since = new Date();
    since.setDate(since.getDate() - days);
    const baseWhere = await this.scopedWhere(user);

    const incidents = await this.prisma.incident.findMany({
      where: { AND: [baseWhere, { createdAt: { gte: since } }] },
      select: { createdAt: true },
    });

    const byDay: Record<string, number> = {};
    for (const i of incidents) {
      const key = i.createdAt.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] ?? 0) + 1;
    }

    const result: Array<{ date: string; count: number }> = [];
    for (let d = 0; d <= days; d++) {
      const day = new Date(since);
      day.setDate(since.getDate() + d);
      const key = day.toISOString().slice(0, 10);
      result.push({ date: key, count: byDay[key] ?? 0 });
    }
    return result;
  }

  async getByPriority(user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'by_priority');

    const baseWhere = await this.scopedWhere(user);
    const openWhere: Prisma.IncidentWhereInput = {
      AND: [
        baseWhere,
        { status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.ARCHIVED] } },
      ],
    };

    const groups = await this.prisma.incident.groupBy({
      by: ['priority'],
      _count: { id: true },
      where: openWhere,
    });

    const all: IncidentPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const countMap = Object.fromEntries(groups.map((g) => [g.priority, g._count.id]));

    return all.map((priority) => ({
      priority,
      count: countMap[priority] ?? 0,
    }));
  }

  async getRecentEvents(user: JwtPayload, limit = 8) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'recent_events');

    const baseWhere = await this.scopedWhere(user);
    const incidents = await this.prisma.incident.findMany({
      where: baseWhere,
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 20),
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        address: true,
        updatedAt: true,
        createdAt: true,
        category: { select: { key: true, name: true } },
      },
    });

    return incidents.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      priority: i.priority,
      address: i.address,
      category: i.category,
      updatedAt: i.updatedAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }));
  }

  async getTopZones(user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'top_zones');

    const baseWhere = await this.scopedWhere(user);
    const incidents = await this.prisma.incident.findMany({
      where: {
        AND: [
          baseWhere,
          { status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.ARCHIVED] } },
        ],
      },
      select: {
        priority: true,
        lat: true,
        lng: true,
      },
    });

    const zoneMeta = this.districtZones.getZoneMeta();
    const metaById = Object.fromEntries(zoneMeta.map((z) => [z.id, z]));

    type ZoneAgg = {
      zoneId: DistrictZoneId;
      count: number;
      criticalCount: number;
      highCount: number;
    };

    const zones = Object.fromEntries(
      DISTRICT_ZONE_ORDER.map((id) => [
        id,
        { zoneId: id, count: 0, criticalCount: 0, highCount: 0 } satisfies ZoneAgg,
      ]),
    ) as Record<DistrictZoneId, ZoneAgg>;

    for (const i of incidents) {
      const zoneId = this.districtZones.classifyPoint(i.lat, i.lng) ?? 'A';
      zones[zoneId].count++;
      if (i.priority === IncidentPriority.CRITICAL) zones[zoneId].criticalCount++;
      if (i.priority === IncidentPriority.HIGH) zones[zoneId].highCount++;
    }

    return DISTRICT_ZONE_ORDER.map((id) => {
      const agg = zones[id];
      const meta = metaById[id];
      return {
        zoneId: id,
        label: meta?.label ?? `Zona ${id}`,
        color: meta?.color ?? '#94a3b8',
        count: agg.count,
        riskLevel:
          agg.criticalCount > 0
            ? 'critical'
            : agg.highCount >= 2 || agg.count >= 8
              ? 'high'
              : agg.count >= 4
                ? 'medium'
                : 'low',
        lat: meta?.lat ?? 40.4093,
        lng: meta?.lng ?? 49.8531,
      };
    }).sort((a, b) => b.count - a.count);
  }

  async getResolutionTimeline(user: JwtPayload, days = 14) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'timeline');

    const since = new Date();
    since.setDate(since.getDate() - days);
    const baseWhere = await this.scopedWhere(user);

    const [created, resolved] = await Promise.all([
      this.prisma.incident.findMany({
        where: { AND: [baseWhere, { createdAt: { gte: since } }] },
        select: { createdAt: true },
      }),
      this.prisma.incident.findMany({
        where: {
          AND: [baseWhere, { resolvedAt: { not: null, gte: since } }],
        },
        select: { resolvedAt: true },
      }),
    ]);

    const createdByDay: Record<string, number> = {};
    const resolvedByDay: Record<string, number> = {};

    for (const i of created) {
      const key = i.createdAt.toISOString().slice(0, 10);
      createdByDay[key] = (createdByDay[key] ?? 0) + 1;
    }
    for (const i of resolved) {
      const key = i.resolvedAt!.toISOString().slice(0, 10);
      resolvedByDay[key] = (resolvedByDay[key] ?? 0) + 1;
    }

    const result: Array<{ date: string; created: number; resolved: number }> = [];
    for (let d = 0; d <= days; d++) {
      const day = new Date(since);
      day.setDate(since.getDate() + d);
      const key = day.toISOString().slice(0, 10);
      result.push({
        date: key,
        created: createdByDay[key] ?? 0,
        resolved: resolvedByDay[key] ?? 0,
      });
    }
    return result;
  }

  async getHotZones(user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_dashboard');
    this.requireAnalytics(scope, 'hot_zones');

    const baseWhere = await this.accessControl.buildIncidentWhere(scope, user.sub);
    const categoryIds =
      baseWhere.categoryId && typeof baseWhere.categoryId === 'object' && 'in' in baseWhere.categoryId
        ? (baseWhere.categoryId as { in: string[] }).in
        : [];

    if (categoryIds.length === 0 && scope.roleKey !== 'super_admin') {
      const incidents = await this.prisma.incident.findMany({
        where: {
          AND: [
            baseWhere,
            { status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.ARCHIVED] } },
          ],
        },
        select: { lat: true, lng: true },
      });

      const grid: Record<string, { grid_lat: number; grid_lng: number; count: number }> = {};
      for (const i of incidents) {
        const grid_lat = Math.round(i.lat * 100) / 100;
        const grid_lng = Math.round(i.lng * 100) / 100;
        const key = `${grid_lat},${grid_lng}`;
        if (!grid[key]) grid[key] = { grid_lat, grid_lng, count: 0 };
        grid[key].count++;
      }

      return Object.values(grid)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }

    const categoryClause =
      categoryIds.length > 0
        ? Prisma.sql`AND category_id IN (${Prisma.join(categoryIds)})`
        : Prisma.empty;

    return this.prisma.$queryRaw<
      Array<{ grid_lat: number; grid_lng: number; count: bigint }>
    >`
      SELECT
        ROUND(lat::numeric, 2) AS grid_lat,
        ROUND(lng::numeric, 2) AS grid_lng,
        COUNT(*)::bigint AS count
      FROM incidents
      WHERE status NOT IN ('RESOLVED', 'ARCHIVED')
        ${categoryClause}
      GROUP BY grid_lat, grid_lng
      ORDER BY count DESC
      LIMIT 20
    `;
  }
}
