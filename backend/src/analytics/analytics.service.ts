import { ForbiddenException, Injectable } from '@nestjs/common';
import { IncidentStatus, Prisma } from '@prisma/client';
import { AccessControlService } from '../access-control/access-control.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private accessControl: AccessControlService,
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

    const [
      activeCount,
      overdueCount,
      newTodayCount,
      resolvedCount,
      criticalCount,
      totalOpen,
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
          AND: [baseWhere, { priority: 'CRITICAL', status: { not: IncidentStatus.RESOLVED } }],
        },
      }),
      this.prisma.incident.count({
        where: {
          AND: [baseWhere, { status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.ARCHIVED] } }],
        },
      }),
    ]);

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

    return {
      activeProblems: activeCount,
      overdueTasks: overdueCount,
      newToday: newTodayCount,
      avgResolutionHours,
      accidentsCount: criticalCount,
      slaPercent: Math.min(slaPercent, 100),
      totalOpen,
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

    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
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
