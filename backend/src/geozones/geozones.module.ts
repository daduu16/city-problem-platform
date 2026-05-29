import { Module } from '@nestjs/common';
import { GeozonesService } from './geozones.service';
import { GeozonesController } from './geozones.controller';
import { DistrictService } from './district.service';

@Module({
  controllers: [GeozonesController],
  providers: [GeozonesService, DistrictService],
  exports: [GeozonesService, DistrictService],
})
export class GeozonesModule {}
