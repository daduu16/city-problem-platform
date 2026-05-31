import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CategoryAssigneesQueryDto } from './dto/category-assignees-query.dto';
import { CreateIncidentTaskDto } from './dto/create-incident-task.dto';
import { DayScheduleQueryDto } from './dto/day-schedule-query.dto';
import { FreeSlotsQueryDto } from './dto/free-slots-query.dto';
import { UpdateIncidentTaskDto } from './dto/update-incident-task.dto';
import { IncidentTasksService } from './incident-tasks.service';

@ApiTags('incident-tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('incident-tasks')
export class IncidentTasksController {
  constructor(private tasksService: IncidentTasksService) {}

  @RequirePermission('assign_task')
  @Get('category-assignees')
  listCategoryAssignees(
    @Query() query: CategoryAssigneesQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.listCategoryAssignees(
      query.categoryId,
      query.search,
      user,
    );
  }

  @RequirePermission('assign_task')
  @Get('availability')
  findAvailability(@Query() query: AvailabilityQueryDto, @CurrentUser() user: JwtPayload) {
    return this.tasksService.findAvailability(
      query.categoryId,
      query.startsAt,
      query.endsAt,
      query.search,
      user,
    );
  }

  @RequirePermission('assign_task')
  @Get('assignees/:assigneeId/day-schedule')
  getDaySchedule(
    @Param('assigneeId') assigneeId: string,
    @Query() query: DayScheduleQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.getAssigneeDaySchedule(
      assigneeId,
      query.date,
      query.draftStartsAt,
      query.draftEndsAt,
      user,
    );
  }

  @RequirePermission('assign_task')
  @Get('assignees/:assigneeId/free-slots')
  findFreeSlots(
    @Param('assigneeId') assigneeId: string,
    @Query() query: FreeSlotsQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.findFreeSlots(
      assigneeId,
      query.from,
      query.to,
      query.durationMinutes ?? 60,
      query.categoryId,
      user,
    );
  }

  @RequirePermission('assign_task')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @RequirePermission('assign_task')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.remove(id, user);
  }
}

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('incidents')
export class IncidentIncidentTasksController {
  constructor(private tasksService: IncidentTasksService) {}

  @RequirePermission('assign_task')
  @Post(':incidentId/tasks')
  create(
    @Param('incidentId') incidentId: string,
    @Body() dto: CreateIncidentTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.createForIncident(incidentId, dto, user);
  }
}
