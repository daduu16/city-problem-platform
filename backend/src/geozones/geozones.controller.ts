import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GeozonesService } from './geozones.service';

@ApiTags('geozones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('geozones')
export class GeozonesController {
  constructor(private geozonesService: GeozonesService) {}

  @RequirePermission('view_map')
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.geozonesService.findAll(user);
  }
}
