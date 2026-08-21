import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { KafkaService } from '../../messaging/kafka.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule implements OnModuleInit {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly gateway: NotificationsGateway,
    private readonly service: NotificationsService,
  ) {}

  onModuleInit() {
    // Injeta deps no KafkaService após ambos inicializados (evita ciclo)
    if (this.kafkaService && typeof (this.kafkaService as any).setNotificationDeps === 'function') {
      (this.kafkaService as any).setNotificationDeps(this.gateway, this.service);
    }
  }
}
