import {
  Body,
  Controller,
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
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserAccessDto } from './dto/update-user-access.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('manage_users')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('roles')
  listRoles() {
    return this.adminService.listRoles();
  }

  @Get('categories')
  listCategories() {
    return this.adminService.listCategories();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.createUser(dto, user.sub);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateUser(id, dto, user.sub);
  }

  @Put('users/:id/access')
  updateAccess(
    @Param('id') id: string,
    @Body() dto: UpdateUserAccessDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateUserAccess(id, dto, user.sub);
  }
}
