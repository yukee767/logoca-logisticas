import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Security
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'health/*'],
  });

  // CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LogoCá Logísticas API')
    .setDescription(
      'Backend Nest.js - Gestão logística B2B/B2C: produtos, pedidos, galpões, mensageria (RabbitMQ/Kafka), cache Ignite e notificações WebSocket.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticação e autorização JWT + RBAC')
    .addTag('Users', 'Usuários e Empresas')
    .addTag('Products', 'Produtos com markup +20% e validação de quantidade mínima')
    .addTag('Orders', 'Pedidos consumer/B2B com RabbitMQ')
    .addTag('Warehouses', 'Galpões, armazenagem e cálculo de frete')
    .addTag('Notifications', 'Notificações WebSocket e Kafka consumer admin')
    .addTag('Health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'LogoCá API Docs',
  });

  await app.listen(port);
  logger.log(`🚀 LogoCá Nest.js rodando em http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger em http://localhost:${port}/${apiPrefix}/docs`);
}
bootstrap();
