import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DistrictsModule } from '../districts/districts.module';
import { NotificationModule } from '../notifications/notification.module';
import { PlacesModule } from '../places/places.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { OpenDataRefreshScheduler } from './opendata-refresh.scheduler';
import { SlaSchedulerService } from './sla-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RealtimeModule,
    NotificationModule,
    PlacesModule,
    DistrictsModule,
  ],
  providers: [SlaSchedulerService, OpenDataRefreshScheduler],
})
export class SchedulerModule {}
