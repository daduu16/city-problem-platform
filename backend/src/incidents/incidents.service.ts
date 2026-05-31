import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DistrictStatus,
  HistoryActionType,
  IncidentStatus,
  Prisma,
} from '@prisma/client';
import { AccessControlService } from '../access-control/access-control.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import {
  DistrictService,
  NARIMANOV_GEOZONE_ID,
} from '../geozones/district.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { IncidentAggregationService } from './incident-aggregation.service';
import { CreateCitizenReportDto } from './dto/create-citizen-report.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentQueryDto } from './dto/incident-query.dto';

const incidentInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, key: true, name: true } },
  subcategory: { select: { id: true, key: true, name: true } },
  attachments: true,
  _count: { select: { comments: true, history: true } },
} satisfies Prisma.IncidentInclude;

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private accessControl: AccessControlService,
    private audit: AuditService,
    private districtService: DistrictService,
    private aggregation: IncidentAggregationService,
  ) {}

  private async getScope(user: JwtPayload) {
    return this.accessControl.getScope(user.sub);
  }

  private async buildScopedWhere(
    user: JwtPayload,
    query?: IncidentQueryDto,
  ): Promise<Prisma.IncidentWhereInput> {
    const scope = await this.getScope(user);
    let where = this.accessControl.buildIncidentWhere(scope, user.sub);
    where = this.accessControl.applyAnalystArchiveFilter(scope, where);

    if (query?.status) where = { AND: [where, { status: query.status }] };
    if (query?.priority) where = { AND: [where, { priority: query.priority }] };
    if (query?.categoryId) where = { AND: [where, { categoryId: query.categoryId }] };
    if (query?.assignedToId) where = { AND: [where, { assignedToId: query.assignedToId }] };

    if (query?.search) {
      where = {
        AND: [
          where,
          {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { address: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        ],
      };
    }

    return where;
  }

  async findAll(query: IncidentQueryDto, user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'view_incidents');

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where = await this.buildScopedWhere(user, query);

    const [items, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        include: incidentInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.incident.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  private async findMapIncidents(
    user: JwtPayload,
    mode: 'active' | 'archived',
  ) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'view_map');

    let where = this.accessControl.buildIncidentWhere(scope, user.sub);

    if (mode === 'archived') {
      where = { AND: [where, { status: IncidentStatus.ARCHIVED }] };
    } else {
      where = this.accessControl.applyAnalystArchiveFilter(scope, where);
      where = {
        AND: [
          where,
          { status: { not: IncidentStatus.ARCHIVED } },
          { districtStatus: DistrictStatus.WITHIN_DISTRICT },
        ],
      };
    }

    const incidents = await this.prisma.incident.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        lat: true,
        lng: true,
        address: true,
        deadline: true,
        slaDueAt: true,
        createdAt: true,
        categoryId: true,
        organizationId: true,
        geozoneId: true,
        districtStatus: true,
        category: { select: { id: true, key: true, name: true } },
        subcategory: { select: { id: true, key: true, name: true } },
        _count: { select: { reports: true } },
      },
    });

    const filtered = this.accessControl.filterMapIncidentsByLayers(
      scope,
      incidents,
    );

    return filtered.map(({ _count, ...row }) => ({
      ...row,
      reportCount: _count.reports,
    }));
  }

  findForMap(user: JwtPayload) {
    return this.findMapIncidents(user, 'active');
  }

  findForArchivedMap(user: JwtPayload) {
    return this.findMapIncidents(user, 'archived');
  }

  async findNearby(lat: number, lng: number, radiusMeters: number, user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'view_map');

    const scopedWhere = this.accessControl.buildIncidentWhere(scope, user.sub);
    const categoryFilter =
      scopedWhere.categoryId && 'in' in (scopedWhere.categoryId as object)
        ? (scopedWhere.categoryId as { in: string[] }).in
        : null;

    const categoryClause = categoryFilter?.length
      ? Prisma.sql`AND category_id IN (${Prisma.join(categoryFilter)})`
      : Prisma.empty;

    const orgClause =
      scopedWhere.organizationId
        ? Prisma.sql`AND organization_id = ${scopedWhere.organizationId as string}`
        : Prisma.empty;

    const assignedClause =
      scopedWhere.assignedToId
        ? Prisma.sql`AND assigned_to = ${scopedWhere.assignedToId as string}`
        : Prisma.empty;

    return this.prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        status: string;
        priority: string;
        lat: number;
        lng: number;
        distance_m: number;
      }>
    >`
      SELECT id, title, status, priority, lat, lng,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM incidents
      WHERE location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${categoryClause}
        ${orgClause}
        ${assignedClause}
        AND district_status = 'WITHIN_DISTRICT'
      ORDER BY distance_m ASC
      LIMIT 100
    `;
  }

  async findOne(id: string, user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'view_incidents');

    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        ...incidentInclude,
        history: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        reports: {
          include: { reporter: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { reports: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        assigneeTasks: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            assignee: {
              include: {
                organization: { select: { id: true, name: true, type: true } },
              },
            },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { startsAt: 'asc' },
        },
      },
    });

    if (!incident) throw new NotFoundException('Incident not found');

    const canView = await this.accessControl.canViewIncident(scope, incident);
    if (!canView) throw new ForbiddenException();

    const { _count, ...row } = incident;
    return { ...row, reportCount: _count.reports };
  }

  /** Citizen report from mobile — creates or attaches to an open incident cluster. */
  async submitCitizenReport(dto: CreateCitizenReportDto, user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'create_incident');

    if (!this.accessControl.canAccessCategory(scope, dto.categoryId)) {
      throw new ForbiddenException('Category not allowed');
    }

    const duplicate = await this.aggregation.findOpenIncidentForReport(
      dto.lat,
      dto.lng,
      dto.categoryId,
      dto.subcategoryId ?? null,
      dto.title,
      scope,
      user.sub,
    );

    if (duplicate) {
      return this.attachCitizenReportToExisting(duplicate.id, dto, user);
    }

    return this.createIncidentWithFirstReport(dto, user);
  }

  /** Dispatcher creates an incident directly (no citizen report row). */
  async create(dto: CreateIncidentDto, user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'create_incident');

    if (!this.accessControl.canAccessCategory(scope, dto.categoryId)) {
      throw new ForbiddenException('Category not allowed');
    }

    const slaHours =
      dto.priority === 'CRITICAL' ? 4 : dto.priority === 'HIGH' ? 12 : 24;

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { organizationId: true },
    });

    const districtStatus = await this.districtService.resolveDistrictStatus(
      dto.lat,
      dto.lng,
    );
    const geozoneId =
      districtStatus === DistrictStatus.WITHIN_DISTRICT
        ? dto.geozoneId ?? NARIMANOV_GEOZONE_ID
        : null;

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? IncidentStatus.NEW,
        priority: dto.priority ?? 'MEDIUM',
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        type: dto.type ?? 'COMPLAINT',
        lat: dto.lat,
        lng: dto.lng,
        address: dto.address,
        geozoneId,
        districtStatus,
        organizationId: dto.organizationId ?? userRecord?.organizationId,
        assignedToId: dto.assignedToId,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        slaDueAt: new Date(Date.now() + slaHours * 3600000),
        createdById: user.sub,
      },
      include: incidentInclude,
    });

    await this.recordHistory(incident.id, user.sub, HistoryActionType.CREATED, null, incident.status);
    await this.audit.log({
      userId: user.sub,
      action: 'INCIDENT_CREATED',
      resource: 'incident',
      resourceId: incident.id,
      metadata: { districtStatus, source: 'dispatcher' },
    });

    if (districtStatus === DistrictStatus.OUTSIDE_DISTRICT) {
      await this.audit.log({
        userId: user.sub,
        action: 'INCIDENT_OUTSIDE_DISTRICT',
        resource: 'incident',
        resourceId: incident.id,
        metadata: { lat: dto.lat, lng: dto.lng, address: dto.address },
      });
      await this.recordHistory(
        incident.id,
        user.sub,
        HistoryActionType.UPDATED,
        null,
        DistrictStatus.OUTSIDE_DISTRICT,
      );
    }
    this.realtime.emitIncidentCreated(incident);
    return incident;
  }

  private async createIncidentWithFirstReport(
    dto: CreateCitizenReportDto,
    user: JwtPayload,
  ) {
    const slaHours = 24;

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { organizationId: true },
    });

    const districtStatus = await this.districtService.resolveDistrictStatus(
      dto.lat,
      dto.lng,
    );
    const geozoneId =
      districtStatus === DistrictStatus.WITHIN_DISTRICT
        ? NARIMANOV_GEOZONE_ID
        : null;

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.message,
        status: IncidentStatus.NEW,
        priority: 'MEDIUM',
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        type: dto.type ?? 'COMPLAINT',
        lat: dto.lat,
        lng: dto.lng,
        address: dto.address,
        geozoneId,
        districtStatus,
        organizationId: userRecord?.organizationId,
        slaDueAt: new Date(Date.now() + slaHours * 3600000),
        createdById: user.sub,
      },
      include: incidentInclude,
    });

    const report = await this.prisma.incidentReport.create({
      data: {
        incidentId: incident.id,
        reporterId: user.sub,
        title: dto.title,
        message: dto.message,
        lat: dto.lat,
        lng: dto.lng,
        address: dto.address,
        photoUrl: dto.photoUrl,
        videoUrl: dto.videoUrl,
      },
    });

    await this.aggregation.recalculateIncidentCentroid(incident.id);

    await this.recordHistory(incident.id, user.sub, HistoryActionType.CREATED, null, incident.status);
    await this.recordHistory(
      incident.id,
      user.sub,
      HistoryActionType.CITIZEN_REPORT,
      null,
      dto.message,
      { reportId: report.id },
    );
    await this.audit.log({
      userId: user.sub,
      action: 'INCIDENT_CREATED',
      resource: 'incident',
      resourceId: incident.id,
      metadata: { districtStatus, source: 'citizen_report' },
    });

    if (districtStatus === DistrictStatus.OUTSIDE_DISTRICT) {
      await this.audit.log({
        userId: user.sub,
        action: 'INCIDENT_OUTSIDE_DISTRICT',
        resource: 'incident',
        resourceId: incident.id,
        metadata: { lat: dto.lat, lng: dto.lng, address: dto.address },
      });
      await this.recordHistory(
        incident.id,
        user.sub,
        HistoryActionType.UPDATED,
        null,
        DistrictStatus.OUTSIDE_DISTRICT,
      );
    }

    const updated = await this.prisma.incident.findUnique({
      where: { id: incident.id },
      include: incidentInclude,
    });

    if (!updated) throw new NotFoundException('Incident not found');

    this.realtime.emitIncidentCreated(updated);
    return updated;
  }

  async update(id: string, dto: UpdateIncidentDto, user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'edit_incident');

    const existing = await this.findOne(id, user);

    if (dto.status === IncidentStatus.RESOLVED) {
      this.accessControl.requirePermission(scope, 'close_task');
    }

    const reportCount = existing.reportCount ?? existing.reports?.length ?? 0;
    const coordsChanged =
      (dto.lat !== undefined && dto.lat !== existing.lat) ||
      (dto.lng !== undefined && dto.lng !== existing.lng);

    if (coordsChanged && reportCount > 0) {
      throw new ForbiddenException(
        'Cannot move incident coordinates while citizen reports exist; map pin follows report centroid',
      );
    }

    let districtUpdate: {
      districtStatus?: DistrictStatus;
      geozoneId?: string | null;
    } = {};

    if (coordsChanged) {
      const lat = dto.lat ?? existing.lat;
      const lng = dto.lng ?? existing.lng;
      const districtStatus = await this.districtService.resolveDistrictStatus(lat, lng);
      districtUpdate = {
        districtStatus,
        geozoneId:
          districtStatus === DistrictStatus.WITHIN_DISTRICT
            ? existing.geozoneId ?? NARIMANOV_GEOZONE_ID
            : null,
      };

      if (
        districtStatus === DistrictStatus.OUTSIDE_DISTRICT &&
        existing.districtStatus === DistrictStatus.WITHIN_DISTRICT
      ) {
        await this.audit.log({
          userId: user.sub,
          action: 'INCIDENT_OUTSIDE_DISTRICT',
          resource: 'incident',
          resourceId: id,
          metadata: { lat, lng },
        });
      }
    }

    const { lat: _lat, lng: _lng, ...dtoWithoutCoords } = dto;
    const updateData =
      coordsChanged && reportCount === 0
        ? { ...dto, ...districtUpdate }
        : { ...dtoWithoutCoords, ...districtUpdate };

    const incident = await this.prisma.incident.update({
      where: { id },
      data: {
        ...updateData,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        resolvedAt:
          dto.status === IncidentStatus.RESOLVED ? new Date() : existing.resolvedAt,
      },
      include: incidentInclude,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.recordHistory(id, user.sub, HistoryActionType.STATUS_CHANGED, existing.status, dto.status);
    }
    if (dto.priority && dto.priority !== existing.priority) {
      await this.recordHistory(id, user.sub, HistoryActionType.PRIORITY_CHANGED, existing.priority, dto.priority);
    }
    if (dto.assignedToId && dto.assignedToId !== existing.assignedToId) {
      this.accessControl.requirePermission(scope, 'assign_task');
      await this.recordHistory(id, user.sub, HistoryActionType.ASSIGNED, existing.assignedToId, dto.assignedToId);
    }

    await this.audit.log({
      userId: user.sub,
      action: 'INCIDENT_UPDATED',
      resource: 'incident',
      resourceId: id,
      metadata: dto as object,
    });

    this.realtime.emitIncidentUpdated(incident);
    return incident;
  }

  async addComment(id: string, body: string, user: JwtPayload) {
    const incident = await this.findOne(id, user);
    const comment = await this.prisma.incidentComment.create({
      data: { incidentId: id, authorId: user.sub, body },
      include: { author: { select: { id: true, name: true } } },
    });
    await this.recordHistory(id, user.sub, HistoryActionType.COMMENT, null, body);
    this.realtime.emitIncidentComment(id, comment, incident);
    return comment;
  }

  private async attachCitizenReportToExisting(
    incidentId: string,
    dto: CreateCitizenReportDto,
    user: JwtPayload,
  ) {
    await this.findOne(incidentId, user);

    const report = await this.prisma.incidentReport.create({
      data: {
        incidentId,
        reporterId: user.sub,
        title: dto.title,
        message: dto.message,
        lat: dto.lat,
        lng: dto.lng,
        address: dto.address,
        photoUrl: dto.photoUrl,
        videoUrl: dto.videoUrl,
      },
    });

    await this.aggregation.recalculateIncidentCentroid(incidentId);

    await this.recordHistory(
      incidentId,
      user.sub,
      HistoryActionType.CITIZEN_REPORT,
      null,
      dto.message,
      { reportId: report.id },
    );

    await this.audit.log({
      userId: user.sub,
      action: 'INCIDENT_REPORT_MERGED',
      resource: 'incident',
      resourceId: incidentId,
      metadata: { message: dto.message, lat: dto.lat, lng: dto.lng },
    });

    const updated = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!updated) throw new NotFoundException('Incident not found');

    this.realtime.emitIncidentUpdated(updated);
    return { ...updated, mergedIntoExisting: true as const };
  }

  private async recordHistory(
    incidentId: string,
    userId: string,
    actionType: HistoryActionType,
    oldValue: string | null | undefined,
    newValue: string | null | undefined,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.incidentHistory.create({
      data: {
        incidentId,
        actionType,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
        createdById: userId,
        metadata: metadata ?? undefined,
      },
    });
  }
}
