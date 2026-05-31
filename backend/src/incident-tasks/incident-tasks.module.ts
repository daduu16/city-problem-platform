import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AssigneeAvailabilityModule } from '../assignee-availability/assignee-availability.module';
import {
  IncidentIncidentTasksController,
  IncidentTasksController,
} from './incident-tasks.controller';
import { IncidentTasksService } from './incident-tasks.service';

@Module({
  imports: [AccessControlModule, AssigneeAvailabilityModule],
  controllers: [IncidentTasksController, IncidentIncidentTasksController],
  providers: [IncidentTasksService],
  exports: [IncidentTasksService],
})
export class IncidentTasksModule {}
