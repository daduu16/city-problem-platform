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

  @RequirePermission('view_dashboard')
  @Get('by-priority')
  getByPriority(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getByPriority(user);
  }

  @RequirePermission('view_dashboard')
  @Get('recent-events')
  getRecentEvents(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getRecentEvents(
      user,
      limit ? parseInt(limit, 10) : 8,
    );
  }

  @RequirePermission('view_dashboard')
  @Get('top-zones')
  getTopZones(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getTopZones(user);
  }

  @RequirePermission('view_dashboard')
  @Get('resolution-timeline')
  getResolutionTimeline(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getResolutionTimeline(
      user,
      days ? parseInt(days, 10) : 14,
    );
  }
}
