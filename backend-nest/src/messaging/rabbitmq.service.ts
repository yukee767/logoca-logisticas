import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import * as amqpConnMgr from 'amqp-connection-manager';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqpConnMgr.AmqpConnectionManager;
  private channelWrapper: amqpConnMgr.ChannelWrapper;
  private rawConnection: amqp.Connection | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('rabbitmq.url');
    const exchange = this.configService.get<string>('rabbitmq.exchange');

    try {
      this.connection = amqpConnMgr.connect([url], {
        reconnectTimeInSeconds: 5,
        heartbeatIntervalInSeconds: 30,
      });

      this.connection.on('connect', () => this.logger.log('RabbitMQ conectado'));
      this.connection.on('disconnect', (err: any) => this.logger.error(`RabbitMQ desconectado: ${err?.err?.message || err?.message || err}`));

      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: amqp.ConfirmChannel) => {
          await channel.assertExchange(exchange, 'topic', { durable: true });
          const queueOrders = this.configService.get<string>('rabbitmq.queueOrders', 'orders.queue');
          const dlq = this.configService.get<string>('rabbitmq.dlq', 'orders.dlq');
          await channel.assertQueue(dlq, { durable: true });
          await channel.assertQueue(queueOrders, {
            durable: true,
            deadLetterExchange: '',
            deadLetterRoutingKey: dlq,
            messageTtl: 60000,
          } as any);
          await channel.bindQueue(queueOrders, exchange, 'order.*');
          await channel.bindQueue(queueOrders, exchange, 'order.created');
          await channel.bindQueue(queueOrders, exchange, 'order.status_changed');
          this.logger.log(`RabbitMQ exchange ${exchange} + queue ${queueOrders} + DLQ ${dlq} asserts ok`);
        },
      });

      await this.channelWrapper.waitForConnect();
    } catch (e) {
      this.logger.warn(`RabbitMQ init adiado (broker off?): ${e.message} - publish tentará reconectar`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channelWrapper?.close();
      await this.connection?.close();
      if (this.rawConnection) {
        await (this.rawConnection as any).close();
      }
    } catch {}
  }

  /**
   * Publica evento de pedido no exchange topic.
   * RoutingKey: order.created / order.status_changed
   * Integração user -> empresa: empresas consomem orders.queue filtrando por companyId se necessário.
   */
  async publishOrder(payload: Record<string, any>): Promise<void> {
    const exchange = this.configService.get<string>('rabbitmq.exchange', 'logoca.exchange');
    const routingKey = (payload.event as string) || 'order.created';

    if (this.channelWrapper) {
      await this.channelWrapper.publish(exchange, routingKey, payload, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });
      this.logger.debug(`RabbitMQ publish ${exchange} rk=${routingKey} payload=${JSON.stringify(payload).slice(0,200)}`);
      return;
    }

    // Fallback directo se wrapper não conectado
    try {
      const url = this.configService.get<string>('rabbitmq.url');
      const conn = await amqp.connect(url);
      const ch = await conn.createChannel();
      await ch.assertExchange(exchange, 'topic', { durable: true });
      ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
        contentType: 'application/json',
      });
      await ch.close();
      await conn.close();
    } catch (e) {
      this.logger.error(`RabbitMQ publish falhou: ${e.message}`);
      throw e;
    }
  }

  /**
   * Consome fila de pedidos. Usado por worker empresa ou serviço interno.
   */
  async consumeOrders(
    onMessage: (msg: Record<string, any>, ack: () => void, nack: (requeue?: boolean) => void) => void,
  ): Promise<void> {
    const queue = this.configService.get<string>('rabbitmq.queueOrders', 'orders.queue');
    const conn = this.connection as any;
    // usa channelWrapper para consumo contínuo
    await this.channelWrapper.addSetup(async (channel: amqp.Channel) => {
      await channel.consume(
        queue,
        (msg) => {
          if (!msg) return;
          try {
            const content = JSON.parse(msg.content.toString());
            onMessage(
              content,
              () => channel.ack(msg),
              (requeue = false) => channel.nack(msg, false, requeue),
            );
          } catch (e) {
            this.logger.error(`Erro ao processar mensagem RabbitMQ: ${e.message}`);
            channel.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
      this.logger.log(`RabbitMQ consumer registrado queue=${queue}`);
    });
  }

  async publish(queue: string, payload: any): Promise<void> {
    if (this.channelWrapper) {
      await this.channelWrapper.sendToQueue(queue, payload, { persistent: true });
      return;
    }
    await this.publishOrder({ event: queue, ...payload });
  }
}
