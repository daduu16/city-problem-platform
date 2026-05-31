import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';
import { AssigneeScheduleController } from './assignee-schedule.controller';
import { AssigneesController } from './assignees.controller';
import { AssigneesService } from './assignees.service';

@Module({
  imports: [AccessControlModule, AuditModule],
  controllers: [AssigneeScheduleController, AssigneesController],
  providers: [AssigneesService],
  exports: [AssigneesService],
})
export class AssigneesModule {}
