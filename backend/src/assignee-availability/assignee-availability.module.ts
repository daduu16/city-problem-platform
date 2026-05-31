import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AssigneeAvailabilityController } from './assignee-availability.controller';
import { AssigneeAvailabilityOverviewController } from './assignee-availability-overview.controller';
import { AssigneeAvailabilityService } from './assignee-availability.service';

@Module({
  imports: [AccessControlModule],
  controllers: [
    AssigneeAvailabilityController,
    AssigneeAvailabilityOverviewController,
  ],
  providers: [AssigneeAvailabilityService],
  exports: [AssigneeAvailabilityService],
})
export class AssigneeAvailabilityModule {}
