import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AssigneesService } from './assignees.service';

@ApiTags('assignees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('assignees')
export class AssigneeScheduleController {
  constructor(private assigneesService: AssigneesService) {}

  @Get('schedule-profile')
  @RequirePermission('view_incidents')
  scheduleProfile(@CurrentUser() user: JwtPayload) {
    return this.assigneesService.findScheduleProfileByEmail(user.email);
  }
}
