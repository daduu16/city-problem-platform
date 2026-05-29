import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GeozonesModule } from '../geozones/geozones.module';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';

@Module({
  imports: [AuditModule, GeozonesModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
