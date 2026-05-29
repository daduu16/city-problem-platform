import { Injectable, Logger } from '@nestjs/common';

export interface NotificationPayload {
  userId?: string;
  channel: 'email' | 'telegram' | 'push' | 'sms';
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async send(payload: NotificationPayload): Promise<void> {
    // Stub: log only until external providers are wired
    this.logger.log(
      `[${payload.channel}] ${payload.subject} → ${payload.userId ?? 'broadcast'}`,
    );
  }

  async notifyOverdue(incidentId: string, assigneeId?: string | null): Promise<void> {
    await this.send({
      userId: assigneeId ?? undefined,
      channel: 'email',
      subject: 'Incident overdue',
      body: `Incident ${incidentId} is now overdue`,
      metadata: { incidentId },
    });
  }
}
