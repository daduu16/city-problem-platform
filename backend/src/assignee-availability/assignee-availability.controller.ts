import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserAccessScope } from '../access-control/access-scope.types';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { AssigneesService } from '../assignees/assignees.service';
import {
  AccessScope,
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AssigneeAvailabilityService } from './assignee-availability.service';
import { ReplaceAvailabilityDto } from './dto/replace-availability.dto';
import { UpsertAvailabilitySlotDto } from './dto/upsert-availability-slot.dto';

@ApiTags('assignee-availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('manage_assignees')
@Controller('assignees/:assigneeId/availability')
export class AssigneeAvailabilityController {
  constructor(
    private availabilityService: AssigneeAvailabilityService,
    private assigneesService: AssigneesService,
  ) {}

  @Get()
  findAll(@Param('assigneeId') assigneeId: string) {
    return this.availabilityService.findAllSlots(assigneeId);
  }

  @Put()
  replaceAll(
    @Param('assigneeId') assigneeId: string,
    @Body() dto: ReplaceAvailabilityDto,
  ) {
    return this.availabilityService.replaceAll(assigneeId, dto.slots);
  }

  @Post('slots')
  createSlot(
    @Param('assigneeId') assigneeId: string,
    @Body() dto: UpsertAvailabilitySlotDto,
  ) {
    return this.availabilityService.createSlot(assigneeId, dto);
  }

  @Patch('slots/:slotId')
  updateSlot(
    @Param('assigneeId') assigneeId: string,
    @Param('slotId') slotId: string,
    @Body() dto: Partial<UpsertAvailabilitySlotDto>,
  ) {
    return this.availabilityService.updateSlot(assigneeId, slotId, dto);
  }

  @Delete('slots/:slotId')
  removeSlot(
    @Param('assigneeId') assigneeId: string,
    @Param('slotId') slotId: string,
  ) {
    return this.availabilityService.removeSlot(assigneeId, slotId);
  }

  @RequirePermission('manage_assignees', 'assign_task', 'view_incidents')
  @Get('calendar')
  async getCalendar(
    @Param('assigneeId') assigneeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtPayload,
    @AccessScope() scope: UserAccessScope | undefined,
  ) {
    const canViewOthers =
      scope?.permissions.includes('manage_assignees') ||
      scope?.permissions.includes('assign_task');
    if (!canViewOthers) {
      const profile = await this.assigneesService.findScheduleProfileByEmail(
        user.email,
      );
      if (!profile || profile.id !== assigneeId) {
        throw new ForbiddenException(
          'You can only view your own assignee schedule',
        );
      }
    }
    return this.availabilityService.getCalendar(assigneeId, from, to);
  }
}
