import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from '../notifications/notification.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SlaSchedulerService } from './sla-scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), RealtimeModule, NotificationModule],
  providers: [SlaSchedulerService],
})
export class SchedulerModule {}
