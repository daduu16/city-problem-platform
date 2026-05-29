import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @RequirePermission('view_dashboard')
  @Get('kpis')
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDashboardKpis(user);
  }

  @RequirePermission('view_dashboard')
  @Get('by-category')
  getByCategory(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getByCategory(user);
  }

  @RequirePermission('view_dashboard')
  @Get('by-status')
  getByStatus(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getByStatus(user);
  }

  @RequirePermission('view_dashboard')
  @Get('timeline')
  getTimeline(@CurrentUser() user: JwtPayload, @Query('days') days?: string) {
    return this.analyticsService.getTimeline(user, days ? parseInt(days, 10) : 7);
  }

  @RequirePermission('view_dashboard')
  @Get('hot-zones')
  getHotZones(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getHotZones(user);
  }
}
