import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserAccessScope } from '../access-control/access-scope.types';
import { AccessControlService } from '../access-control/access-control.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  INCIDENT_MERGE_RADIUS_M,
  centroidFromCoordinates,
  isSameIncidentTopic,
} from './incident-proximity';

const OPEN_STATUSES = ['NEW', 'IN_PROGRESS', 'PENDING', 'OVERDUE'] as const;

export interface ReportCoordinateInput {
  lat: number;
  lng: number;
  title: string;
  message: string;
  address?: string;
}

@Injectable()
export class IncidentAggregationService {
  constructor(
    private prisma: PrismaService,
    private accessControl: AccessControlService,
  ) {}

  async findOpenIncidentForReport(
    lat: number,
    lng: number,
    categoryId: string,
    subcategoryId: string | null,
    title: string,
    scope: UserAccessScope,
    userId: string,
  ): Promise<{ id: string; title: string } | null> {
    const scopedWhere = this.accessControl.buildIncidentWhere(scope, userId);

    const categoryFilter =
      scopedWhere.categoryId && 'in' in (scopedWhere.categoryId as object)
        ? (scopedWhere.categoryId as { in: string[] }).in
        : null;

    if (categoryFilter?.length && !categoryFilter.includes(categoryId)) {
      return null;
    }

    const categoryClause = categoryFilter?.length
      ? Prisma.sql`AND i.category_id IN (${Prisma.join(categoryFilter)})`
      : Prisma.sql`AND i.category_id = ${categoryId}`;

    const subcategoryClause =
      subcategoryId != null
        ? Prisma.sql`AND i.subcategory_id = ${subcategoryId}`
        : Prisma.sql`AND i.subcategory_id IS NULL`;

    const orgClause = scopedWhere.organizationId
      ? Prisma.sql`AND i.organization_id = ${scopedWhere.organizationId as string}`
      : Prisma.empty;

    const assignedClause = scopedWhere.assignedToId
      ? Prisma.sql`AND i.assigned_to = ${scopedWhere.assignedToId as string}`
      : Prisma.empty;

    const point = Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
    const openStatuses = Prisma.join(OPEN_STATUSES.map((s) => Prisma.sql`${s}`));

    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; title: string; distance_m: number }>
    >`
      SELECT i.id, i.title,
        LEAST(
          COALESCE(ST_Distance(i.location, ${point}), 1e15::float8),
          COALESCE((
            SELECT MIN(ST_Distance(r.location, ${point}))
            FROM incident_reports r
            WHERE r.incident_id = i.id AND r.location IS NOT NULL
          ), 1e15::float8)
        ) AS distance_m
      FROM incidents i
      WHERE i.status IN (${openStatuses})
        AND i.district_status = 'WITHIN_DISTRICT'
        ${categoryClause}
        ${subcategoryClause}
        ${orgClause}
        ${assignedClause}
        AND (
          (i.location IS NOT NULL AND ST_DWithin(i.location, ${point}, ${INCIDENT_MERGE_RADIUS_M}))
          OR EXISTS (
            SELECT 1 FROM incident_reports r
            WHERE r.incident_id = i.id
              AND r.location IS NOT NULL
              AND ST_DWithin(r.location, ${point}, ${INCIDENT_MERGE_RADIUS_M})
          )
        )
      ORDER BY distance_m ASC
      LIMIT 20
    `;

    return rows.find((row) => isSameIncidentTopic(row.title, title)) ?? null;
  }

  async recalculateIncidentCentroid(incidentId: string): Promise<void> {
    const reports = await this.prisma.incidentReport.findMany({
      where: { incidentId },
      select: { lat: true, lng: true },
    });

    const centroid = centroidFromCoordinates(reports);
    if (!centroid) return;

    await this.prisma.incident.update({
      where: { id: incidentId },
      data: { lat: centroid.lat, lng: centroid.lng },
    });
  }

  computeCentroid(points: Array<{ lat: number; lng: number }>) {
    return centroidFromCoordinates(points);
  }
}
