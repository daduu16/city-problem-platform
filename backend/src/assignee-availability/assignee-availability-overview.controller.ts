import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AssigneeAvailabilityService } from './assignee-availability.service';

@ApiTags('assignee-availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('manage_assignees')
@Controller('admin/availability-overview')
export class AssigneeAvailabilityOverviewController {
  constructor(private availabilityService: AssigneeAvailabilityService) {}

  @Get()
  getOverview(@Query('from') from: string, @Query('to') to: string) {
    return this.availabilityService.getGlobalOverview(from, to);
  }
}
