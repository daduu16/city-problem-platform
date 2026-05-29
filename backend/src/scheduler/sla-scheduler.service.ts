import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IncidentStatus } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class SlaSchedulerService {
  private readonly logger = new Logger(SlaSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private notifications: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async markOverdueIncidents() {
    const now = new Date();
    const overdue = await this.prisma.incident.findMany({
      where: {
        status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.ARCHIVED, IncidentStatus.OVERDUE] },
        slaDueAt: { lt: now },
      },
      include: { category: true },
    });

    if (overdue.length === 0) return;

    await this.prisma.incident.updateMany({
      where: { id: { in: overdue.map((i) => i.id) } },
      data: { status: IncidentStatus.OVERDUE },
    });

    for (const incident of overdue) {
      const updated = { ...incident, status: IncidentStatus.OVERDUE };
      this.realtime.emitIncidentUpdatedToRooms(
        updated,
        this.realtime.getIncidentRooms(incident),
      );
      await this.notifications.notifyOverdue(incident.id, incident.assignedToId);
    }

    this.logger.log(`Marked ${overdue.length} incidents as OVERDUE`);
  }
}
