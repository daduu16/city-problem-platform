import { Module } from '@nestjs/common';
import { DistrictDataService } from './district-data.service';
import { DistrictZonesService } from './district-zones.service';
import { DistrictsController } from './districts.controller';

@Module({
  controllers: [DistrictsController],
  providers: [DistrictDataService, DistrictZonesService],
  exports: [DistrictDataService, DistrictZonesService],
})
export class DistrictsModule {}
