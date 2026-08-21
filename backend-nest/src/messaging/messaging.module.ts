import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { KafkaService } from './kafka.service';
import { IgniteCacheService } from './ignite-cache.service';

@Global()
@Module({
  providers: [RabbitMQService, KafkaService, IgniteCacheService],
  exports: [RabbitMQService, KafkaService, IgniteCacheService],
})
export class MessagingModule {}
