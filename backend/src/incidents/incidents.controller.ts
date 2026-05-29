import {
  Body,
  Controller,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentQueryDto, NearbyQueryDto } from './dto/incident-query.dto';
import { AddCommentDto } from './dto/add-comment.dto';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @RequirePermission('view_incidents')
  @Get()
  findAll(@Query() query: IncidentQueryDto, @CurrentUser() user: JwtPayload) {
    return this.incidentsService.findAll(query, user);
  }

  @RequirePermission('view_map')
  @Get('map/archived')
  findArchivedForMap(@CurrentUser() user: JwtPayload) {
    return this.incidentsService.findForArchivedMap(user);
  }

  @RequirePermission('view_map')
  @Get('map')
  findForMap(@CurrentUser() user: JwtPayload) {
    return this.incidentsService.findForMap(user);
  }

  @RequirePermission('view_map')
  @Get('nearby')
  findNearby(@Query() query: NearbyQueryDto, @CurrentUser() user: JwtPayload) {
    return this.incidentsService.findNearby(
      query.lat,
      query.lng,
      query.radiusMeters ?? 1000,
      user,
    );
  }

  @RequirePermission('view_incidents')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.incidentsService.findOne(id, user);
  }

  @RequirePermission('create_incident')
  @Post()
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: JwtPayload) {
    return this.incidentsService.create(dto, user);
  }

  @RequirePermission('edit_incident')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incidentsService.update(id, dto, user);
  }

  @RequirePermission('view_incidents')
  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incidentsService.addComment(id, dto.body, user);
  }
}
