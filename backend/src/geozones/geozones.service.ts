import { Injectable } from '@nestjs/common';
import { AccessControlService } from '../access-control/access-control.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeozonesService {
  constructor(
    private prisma: PrismaService,
    private accessControl: AccessControlService,
  ) {}

  async findAll(user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_map');

    const where =
      scope.roleKey === 'super_admin' || scope.geozoneIds.length === 0
        ? { isActive: true }
        : { isActive: true, id: { in: scope.geozoneIds } };

    return this.prisma.geozone.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }
}
