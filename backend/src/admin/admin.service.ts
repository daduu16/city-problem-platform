import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlService } from '../access-control/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserAccessDto } from './dto/update-user-access.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private accessControl: AccessControlService,
    private audit: AuditService,
  ) {}

  listRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
  }

  listUsers() {
    return this.prisma.user.findMany({
      include: {
        role: true,
        organization: true,
        categoryAccess: { include: { category: true } },
        geozoneAccess: { include: { geozone: true } },
        mapLayerAccess: true,
        analyticsAccess: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createUser(dto: CreateUserDto, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new BadRequestException('Invalid role');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        roleId: dto.roleId,
        organizationId: dto.organizationId,
        department: dto.department,
        phone: dto.phone,
        defaultGeozoneId: dto.defaultGeozoneId,
      },
      include: { role: true, organization: true },
    });

    await this.audit.log({
      userId: actorId,
      action: 'USER_CREATED',
      resource: 'user',
      resourceId: user.id,
      metadata: { email: user.email },
    });

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        department: dto.department,
        phone: dto.phone,
        roleId: dto.roleId,
        organizationId: dto.organizationId,
        isActive: dto.isActive,
        defaultGeozoneId: dto.defaultGeozoneId,
      },
      include: { role: true, organization: true },
    });

    await this.accessControl.invalidateScope(id);
    await this.audit.log({
      userId: actorId,
      action: 'USER_UPDATED',
      resource: 'user',
      resourceId: id,
    });

    return user;
  }

  async updateUserAccess(id: string, dto: UpdateUserAccessDto, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      if (dto.categoryIds) {
        await tx.userCategoryAccess.deleteMany({ where: { userId: id } });
        if (dto.categoryIds.length) {
          await tx.userCategoryAccess.createMany({
            data: dto.categoryIds.map((categoryId) => ({ userId: id, categoryId })),
          });
        }
      }

      if (dto.geozoneIds) {
        await tx.userGeozoneAccess.deleteMany({ where: { userId: id } });
        if (dto.geozoneIds.length) {
          await tx.userGeozoneAccess.createMany({
            data: dto.geozoneIds.map((geozoneId) => ({ userId: id, geozoneId })),
          });
        }
      }

      if (dto.mapLayers) {
        await tx.userMapLayerAccess.deleteMany({ where: { userId: id } });
        if (dto.mapLayers.length) {
          await tx.userMapLayerAccess.createMany({
            data: dto.mapLayers.map((layerKey) => ({ userId: id, layerKey })),
          });
        }
      }

      if (dto.analyticsKeys) {
        await tx.userAnalyticsAccess.deleteMany({ where: { userId: id } });
        if (dto.analyticsKeys.length) {
          await tx.userAnalyticsAccess.createMany({
            data: dto.analyticsKeys.map((analyticsKey) => ({ userId: id, analyticsKey })),
          });
        }
      }
    });

    await this.accessControl.invalidateScope(id);
    await this.audit.log({
      userId: actorId,
      action: 'ACCESS_UPDATED',
      resource: 'user',
      resourceId: id,
      metadata: dto as object,
    });

    return this.accessControl.getScope(id);
  }
}
