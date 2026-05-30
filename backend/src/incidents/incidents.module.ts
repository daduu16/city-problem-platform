import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GeozonesModule } from '../geozones/geozones.module';
import { IncidentAggregationService } from './incident-aggregation.service';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';

@Module({
  imports: [AuditModule, GeozonesModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentAggregationService],
  exports: [IncidentsService, IncidentAggregationService],
})
export class IncidentsModule {}
