import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAssigneeDto } from './dto/create-assignee.dto';
import { UpdateAssigneeDto } from './dto/update-assignee.dto';
import { SetAssigneeCategoriesDto } from './dto/set-assignee-categories.dto';

const assigneeInclude = {
  organization: { select: { id: true, name: true, type: true } },
  categories: {
    include: {
      category: {
        select: { id: true, key: true, name: true, parentId: true },
      },
    },
  },
} as const;

@Injectable()
export class AssigneesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
  }

  listOrganizations() {
    return this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true },
    });
  }

  findAll() {
    return this.prisma.categoryAssignee.findMany({
      include: assigneeInclude,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.categoryAssignee.findUnique({
      where: { id },
      include: assigneeInclude,
    });
    if (!row) throw new NotFoundException('Assignee not found');
    return row;
  }

  async create(dto: CreateAssigneeDto, actorId: string) {
    await this.validateOrganization(dto.organizationId);
    const categoryIds = dto.categoryIds ?? [];
    await this.validateCategoryIds(categoryIds);

    const assignee = await this.prisma.categoryAssignee.create({
      data: {
        kind: dto.kind,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        contactEmail: dto.contactEmail?.trim() || null,
        contactPhone: dto.contactPhone?.trim() || null,
        organizationId: dto.organizationId ?? null,
        isActive: dto.isActive ?? true,
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: assigneeInclude,
    });

    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      resource: 'category_assignee',
      resourceId: assignee.id,
      metadata: { name: assignee.name, kind: assignee.kind },
    });

    return assignee;
  }

  async update(id: string, dto: UpdateAssigneeDto, actorId: string) {
    await this.findOne(id);
    if (dto.organizationId !== undefined) {
      await this.validateOrganization(dto.organizationId);
    }

    const assignee = await this.prisma.categoryAssignee.update({
      where: { id },
      data: {
        ...(dto.kind !== undefined && { kind: dto.kind }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
        ...(dto.contactEmail !== undefined && {
          contactEmail: dto.contactEmail?.trim() || null,
        }),
        ...(dto.contactPhone !== undefined && {
          contactPhone: dto.contactPhone?.trim() || null,
        }),
        ...(dto.organizationId !== undefined && {
          organizationId: dto.organizationId,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: assigneeInclude,
    });

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      resource: 'category_assignee',
      resourceId: id,
    });

    return assignee;
  }

  async setCategories(
    id: string,
    dto: SetAssigneeCategoriesDto,
    actorId: string,
  ) {
    await this.findOne(id);
    await this.validateCategoryIds(dto.categoryIds);

    await this.prisma.$transaction([
      this.prisma.categoryAssigneeCategory.deleteMany({
        where: { assigneeId: id },
      }),
      ...dto.categoryIds.map((categoryId) =>
        this.prisma.categoryAssigneeCategory.create({
          data: { assigneeId: id, categoryId },
        }),
      ),
    ]);

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      resource: 'category_assignee_categories',
      resourceId: id,
      metadata: { categoryCount: dto.categoryIds.length },
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const existing = await this.findOne(id);
    await this.prisma.categoryAssignee.delete({ where: { id } });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      resource: 'category_assignee',
      resourceId: id,
      metadata: { name: existing.name },
    });
    return { ok: true };
  }

  private async validateOrganization(organizationId?: string | null) {
    if (!organizationId) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new BadRequestException('Invalid organization');
  }

  private async validateCategoryIds(categoryIds: string[]) {
    if (categoryIds.length === 0) return;
    const found = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, parentId: true },
    });
    if (found.length !== categoryIds.length) {
      throw new BadRequestException('One or more categories are invalid');
    }
    const leafOnly = found.filter((c) => c.parentId !== null);
    if (leafOnly.length !== categoryIds.length) {
      throw new BadRequestException(
        'Only leaf subcategories can be assigned (not parent groups)',
      );
    }
  }
}
