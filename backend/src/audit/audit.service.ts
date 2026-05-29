import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
      },
    });
  }

  async findAll(query: {
    userId?: string;
    resource?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.AuditLogWhereInput = {};

    if (query.userId) where.userId = query.userId;
    if (query.resource) where.resource = query.resource;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
