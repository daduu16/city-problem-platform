import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlacesService } from './places.service';

@ApiTags('places')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('places')
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  @RequirePermission('view_map')
  @Get('narimanov')
  findAllNarimanov() {
    return this.placesService.getAll();
  }

  @RequirePermission('view_map')
  @Get('narimanov/manifest')
  getManifest() {
    return this.placesService.getManifest();
  }

  @RequirePermission('view_map')
  @Get('narimanov/types/:type')
  findByType(@Param('type') type: string) {
    return this.placesService.getByType(type);
  }
}
