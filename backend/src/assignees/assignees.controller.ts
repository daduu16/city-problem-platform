import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { AssigneesService } from './assignees.service';
import { CreateAssigneeDto } from './dto/create-assignee.dto';
import { SetAssigneeCategoriesDto } from './dto/set-assignee-categories.dto';
import { UpdateAssigneeDto } from './dto/update-assignee.dto';

@ApiTags('assignees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('manage_assignees')
@Controller('assignees')
export class AssigneesController {
  constructor(private assigneesService: AssigneesService) {}

  @Get('categories')
  listCategories() {
    return this.assigneesService.listCategories();
  }

  @Get('organizations')
  listOrganizations() {
    return this.assigneesService.listOrganizations();
  }

  @Get()
  findAll() {
    return this.assigneesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assigneesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAssigneeDto, @CurrentUser() user: JwtPayload) {
    return this.assigneesService.create(dto, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssigneeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assigneesService.update(id, dto, user.sub);
  }

  @Put(':id/categories')
  setCategories(
    @Param('id') id: string,
    @Body() dto: SetAssigneeCategoriesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assigneesService.setCategories(id, dto, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.assigneesService.remove(id, user.sub);
  }
}
