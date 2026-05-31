import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessControlService } from '../access-control/access-control.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    private prisma: PrismaService,
    private accessControl: AccessControlService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    const all = await this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    if (this.accessControl.isSuperAdmin(scope)) {
      return all;
    }

    if (scope.categoryIds.length === 0) {
      return [];
    }

    const allowed = new Set(scope.categoryIds);
    return all.filter((c) => allowed.has(c.id));
  }
}
