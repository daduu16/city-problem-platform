import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../access-control/decorators/require-permission.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DistrictDataService } from './district-data.service';

@ApiTags('districts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('districts')
export class DistrictsController {
  constructor(private districtDataService: DistrictDataService) {}

  @RequirePermission('view_map')
  @Get('narimanov')
  getNarimanov() {
    return this.districtDataService.getNarimanov();
  }

  @RequirePermission('view_map')
  @Get('narimanov/manifest')
  getNarimanovManifest() {
    return this.districtDataService.getManifest();
  }
}
