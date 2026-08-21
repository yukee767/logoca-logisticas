import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isProducerConnected = false;
  private isConsumerConnected = false;

  // Injeção opcional para evitar ciclo Messaging <-> Notifications
  private notificationsGateway: any = null;
  private notificationsService: any = null;

  constructor(private configService: ConfigService) {}

  setNotificationDeps(gateway: any, service: any) {
    this.notificationsGateway = gateway;
    this.notificationsService = service;
  }

  async onModuleInit() {
    const brokers = this.configService.get<string[]>('kafka.brokers', ['localhost:9092']);
    const clientId = this.configService.get<string>('kafka.clientId', 'logoca-nest');

    this.kafka = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.WARN,
      retry: { initialRetryTime: 300, retries: 8 },
    });

    this.producer = this.kafka.producer({ allowAutoTopicCreation: true });
    const groupId = this.configService.get<string>('kafka.groupId', 'logoca-admin-group');
    this.consumer = this.kafka.consumer({ groupId, allowAutoTopicCreation: true });

    // Conecta producer (não bloqueia se Kafka off)
    try {
      await this.producer.connect();
      this.isProducerConnected = true;
      this.logger.log(`Kafka producer conectado brokers=${brokers.join(',')}`);
    } catch (e) {
      this.logger.warn(`Kafka producer não conectado (broker off?): ${e.message}`);
    }

    // Consumer admin: consome topic admin e orders para dashboard admin + websockets
    try {
      await this.consumer.connect();
      this.isConsumerConnected = true;

      const topicAdmin = this.configService.get<string>('kafka.topicAdmin', 'logoca.admin.events');
      const topicOrders = this.configService.get<string>('kafka.topicOrders', 'logoca.orders');
      const topicNotifications = this.configService.get<string>('kafka.topicNotifications', 'logoca.notifications');

      await this.consumer.subscribe({ topic: topicAdmin, fromBeginning: false });
      await this.consumer.subscribe({ topic: topicOrders, fromBeginning: false });
      await this.consumer.subscribe({ topic: topicNotifications, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = message.value?.toString() || '{}';
            const payload = JSON.parse(value);
            this.logger.log(`Kafka recv topic=${topic} partition=${partition} event=${payload.event || 'unknown'}`);

            // Persiste para notificações e emite via WebSocket
            const notifPayload = {
              event: payload.event || `kafka:${topic}`,
              orderId: payload.orderId,
              userId: payload.userId,
              companyId: payload.companyId,
              message: payload.message || `Evento ${payload.event || topic} recebido`,
              timestamp: new Date().toISOString(),
              metadata: { topic, partition, ...payload },
            };

            // Se gateway disponível, broadcast
            if (this.notificationsGateway) {
              if (topic === topicAdmin || payload.event?.includes('admin')) {
                this.notificationsGateway.broadcastAdmin(notifPayload as any);
              } else if (payload.companyId) {
                this.notificationsGateway.sendToCompany(payload.companyId, notifPayload as any);
              } else if (payload.userId) {
                this.notificationsGateway.sendToUser(payload.userId, notifPayload as any);
              } else {
                this.notificationsGateway.broadcastAdmin(notifPayload as any);
              }
            }

            if (this.notificationsService) {
              await this.notificationsService.broadcastToAdmin(notifPayload);
            }
          } catch (e) {
            this.logger.error(`Erro no consumer Kafka: ${e.message}`);
          }
        },
      });

      this.logger.log(`Kafka consumer admin conectado group=${groupId} topics=[${topicAdmin}, ${topicOrders}, ${topicNotifications}]`);
    } catch (e) {
      this.logger.warn(`Kafka consumer não conectado: ${e.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.isProducerConnected) await this.producer.disconnect();
      if (this.isConsumerConnected) await this.consumer.disconnect();
    } catch {}
  }

  async emit(topic: string, payload: Record<string, any>): Promise<void> {
    const message = {
      key: payload.orderId || payload.userId || String(Date.now()),
      value: JSON.stringify({ ...payload, _ts: new Date().toISOString() }),
    };

    if (this.isProducerConnected) {
      await this.producer.send({ topic, messages: [message] });
      this.logger.debug(`Kafka emit topic=${topic} key=${message.key}`);
      return;
    }

    // Tenta conectar sob demanda
    try {
      await this.producer.connect();
      this.isProducerConnected = true;
      await this.producer.send({ topic, messages: [message] });
    } catch (e) {
      this.logger.error(`Kafka emit falhou topic=${topic}: ${e.message}`);
      throw e;
    }
  }

  async emitAdminEvent(payload: Record<string, any>): Promise<void> {
    const topic = this.configService.get<string>('kafka.topicAdmin', 'logoca.admin.events');
    return this.emit(topic, payload);
  }
}
