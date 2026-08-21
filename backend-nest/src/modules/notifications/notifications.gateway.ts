import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService, NotificationPayload } from './notifications.service';

/**
 * WebSocket Gateway para notificações em tempo real.
 * - Autenticação via JWT no handshake (auth.token)
 * - Salas: user:{userId}, company:{companyId}, admin
 * - Kafka consumer admin dispara broadcast via server.emit
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization?.replace('Bearer ', '') as string);

      if (!token) {
        this.logger.warn(`Client ${client.id} sem token - conexão como anon`);
        client.data.user = null;
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data.user = payload;
      // Join salas por role
      client.join(`user:${payload.sub}`);
      if (payload.companyId) {
        client.join(`company:${payload.companyId}`);
      }
      if (payload.role === 'admin') {
        client.join('admin');
      }

      this.logger.log(
        `Client conectado ${client.id} | user ${payload.sub} [${payload.role}] | rooms user:${payload.sub}${payload.companyId ? ` company:${payload.companyId}` : ''}${payload.role === 'admin' ? ' admin' : ''}`,
      );

      client.emit('connected', {
        message: 'Conectado ao gateway de notificações LogoCá',
        userId: payload.sub,
        role: payload.role,
      });
    } catch (e) {
      this.logger.warn(`Falha auth socket ${client.id}: ${e.message}`);
      client.emit('error', { message: 'Token inválido' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client desconectado ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    // Só admin pode join arbitrário
    if (client.data.user?.role !== 'admin') {
      return { event: 'error', data: { message: 'Apenas admin pode entrar em salas arbitrárias' } };
    }
    client.join(data.room);
    return { event: 'joined', data: { room: data.room } };
  }

  // Métodos chamados por services / Kafka consumer

  sendToUser(userId: string, payload: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('notification', payload);
    this.logger.debug(`WS -> user:${userId} | ${payload.event}`);
  }

  sendToCompany(companyId: string, payload: NotificationPayload) {
    this.server.to(`company:${companyId}`).emit('notification', payload);
    this.logger.debug(`WS -> company:${companyId} | ${payload.event}`);
  }

  broadcastAdmin(payload: NotificationPayload) {
    this.server.to('admin').emit('admin-notification', payload);
    // também broadcast geral para dashboard admin
    this.server.emit('admin-broadcast', payload);
    this.logger.debug(`WS broadcast admin: ${payload.event}`);
  }

  broadcastAll(payload: NotificationPayload) {
    this.server.emit('notification', payload);
  }
}
