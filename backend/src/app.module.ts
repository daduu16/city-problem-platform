import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AccessControlModule } from './access-control/access-control.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IncidentsModule } from './incidents/incidents.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GeozonesModule } from './geozones/geozones.module';
import { DistrictsModule } from './districts/districts.module';
import { PlacesModule } from './places/places.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CategoriesModule } from './categories/categories.module';
import { NotificationModule } from './notifications/notification.module';
import { AiModule } from './ai/ai.module';
import { MobileApiModule } from './mobile-api/mobile-api.module';
import { AssigneesModule } from './assignees/assignees.module';
import { IncidentTasksModule } from './incident-tasks/incident-tasks.module';
import { AssigneeAvailabilityModule } from './assignee-availability/assignee-availability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // backend/.env is synced from repo root .env by scripts/lib/env.js
      envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '../.env')],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AccessControlModule,
    AuthModule,
    UsersModule,
    IncidentsModule,
    AnalyticsModule,
    GeozonesModule,
    PlacesModule,
    DistrictsModule,
    RealtimeModule,
    AdminModule,
    AuditModule,
    SchedulerModule,
    CategoriesModule,
    NotificationModule,
    AiModule,
    MobileApiModule,
    AssigneesModule,
    AssigneeAvailabilityModule,
    IncidentTasksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
