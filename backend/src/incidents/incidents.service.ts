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

  async findForMap(user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'view_map');

    let where = this.accessControl.buildIncidentWhere(scope, user.sub);
    where = this.accessControl.applyAnalystArchiveFilter(scope, where);
    where = {
      AND: [where, { districtStatus: DistrictStatus.WITHIN_DISTRICT }],
    };

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
      },
    });

    return this.accessControl.filterMapIncidentsByLayers(scope, incidents);
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
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!incident) throw new NotFoundException('Incident not found');

    const canView = await this.accessControl.canViewIncident(scope, incident);
    if (!canView) throw new ForbiddenException();

    return incident;
  }

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
      metadata: { districtStatus },
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

  async update(id: string, dto: UpdateIncidentDto, user: JwtPayload) {
    const scope = await this.getScope(user);
    this.accessControl.requirePermission(scope, 'edit_incident');

    const existing = await this.findOne(id, user);

    if (dto.status === IncidentStatus.RESOLVED) {
      this.accessControl.requirePermission(scope, 'close_task');
    }

    const coordsChanged =
      (dto.lat !== undefined && dto.lat !== existing.lat) ||
      (dto.lng !== undefined && dto.lng !== existing.lng);

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

    const incident = await this.prisma.incident.update({
      where: { id },
      data: {
        ...dto,
        ...districtUpdate,
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

  private async recordHistory(
    incidentId: string,
    userId: string,
    actionType: HistoryActionType,
    oldValue: string | null | undefined,
    newValue: string | null | undefined,
  ) {
    await this.prisma.incidentHistory.create({
      data: {
        incidentId,
        actionType,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
        createdById: userId,
      },
    });
  }
}
