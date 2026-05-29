import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @RequirePermission('assign_task')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
