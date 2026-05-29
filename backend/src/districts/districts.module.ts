import { Module } from '@nestjs/common';
import { DistrictDataService } from './district-data.service';
import { DistrictsController } from './districts.controller';

@Module({
  controllers: [DistrictsController],
  providers: [DistrictDataService],
  exports: [DistrictDataService],
})
export class DistrictsModule {}
