import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AccessControlService } from '../access-control/access-control.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private accessControl: AccessControlService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string }>(token);
      const scope = await this.accessControl.getScope(payload.sub);
      const rooms = this.accessControl.getRealtimeRooms(scope);

      for (const room of rooms) {
        client.join(room);
      }

      client.data.userId = payload.sub;
      client.data.rooms = rooms;
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // rooms cleaned up automatically
  }

  getIncidentRooms(incident: {
    organizationId?: string | null;
    geozoneId?: string | null;
    categoryId: string;
  }): string[] {
    return this.accessControl.getIncidentEmitRooms(incident);
  }

  emitIncidentCreated(incident: unknown & {
    organizationId?: string | null;
    geozoneId?: string | null;
    categoryId: string;
  }) {
    const rooms = this.getIncidentRooms(incident);
    for (const room of rooms) {
      this.server?.to(room).emit('incident:created', incident);
    }
  }

  emitIncidentUpdated(incident: unknown & {
    organizationId?: string | null;
    geozoneId?: string | null;
    categoryId: string;
  }) {
    const rooms = this.getIncidentRooms(incident);
    for (const room of rooms) {
      this.server?.to(room).emit('incident:updated', incident);
    }
  }

  emitIncidentUpdatedToRooms(incident: unknown, rooms: string[]) {
    for (const room of rooms) {
      this.server?.to(room).emit('incident:updated', incident);
    }
  }

  emitIncidentComment(
    incidentId: string,
    comment: unknown,
    incident: {
      organizationId?: string | null;
      geozoneId?: string | null;
      categoryId: string;
    },
  ) {
    const rooms = this.getIncidentRooms(incident);
    const payload = { incidentId, comment };
    for (const room of rooms) {
      this.server?.to(room).emit('incident:comment', payload);
    }
  }
}
