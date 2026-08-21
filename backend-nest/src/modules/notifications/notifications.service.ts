import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NotificationPayload {
  event: string;
  orderId?: string;
  userId?: string;
  companyId?: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notifications: NotificationPayload[] = [];

  constructor(private configService: ConfigService) {}

  async sendToUser(userId: string, payload: Omit<NotificationPayload, 'timestamp'>) {
    const notification: NotificationPayload = {
      ...payload,
      userId,
      timestamp: new Date().toISOString(),
    };
    this.notifications.push(notification);
    this.logger.log(`Notificação para user ${userId}: ${payload.event}`);
    return notification;
  }

  async broadcastToAdmin(payload: Omit<NotificationPayload, 'timestamp'>) {
    const notification: NotificationPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    this.notifications.push(notification);
    this.logger.log(`Broadcast admin: ${payload.event}`);
    return notification;
  }

  findAll(): NotificationPayload[] {
    return [...this.notifications].reverse().slice(0, 100);
  }

  findByUser(userId: string): NotificationPayload[] {
    return this.notifications.filter((n) => n.userId === userId).reverse().slice(0, 50);
  }
}
