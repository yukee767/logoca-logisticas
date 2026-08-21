# LogoCá Logísticas - Backend Nest.js

Stack: Node 20, Nest.js 10, TypeORM, PostgreSQL, Redis, RabbitMQ (amqplib), Kafka (kafkajs), JWT, Apache Ignite.

## Quick start

```bash
cp .env.example .env
npm install
npm run migration:run   # opcional, ou synchronize=true em dev
npm run start:dev
```

Swagger: `http://localhost:3000/api/v1/docs`  
Health: `http://localhost:3000/health`

## Env principais

`DB_*`, `JWT_SECRET`, `REDIS_*`, `RABBITMQ_URL`, `KAFKA_BROKERS`, `IGNITE_HOST/PORT`.

## Módulos

- **auth** - JWT + RBAC (admin, empresa, consumidor) - `POST /api/v1/auth/{register,login,refresh}`
- **users** - CRUD users + companies
- **products** - CRUD + cálculo automático `finalPrice = basePrice * 1.20` + validação `minQuantity`
- **orders** - criação consumer/B2B (RabbitMQ `order.created` user→empresa, Kafka `logoca.orders` admin)
- **warehouses** - galpões, alocação armazenagem, `freight = base + km*perKm + kg*perKg`
- **notifications** - WebSocket `/notifications` (rooms `user:{id}`, `company:{id}`, `admin`) + Kafka consumer admin broadcast
- **messaging** - `RabbitMQService`, `KafkaService`, `IgniteCacheService` (user-cache/admin-cache separados, fallback memória)

## Docker

```bash
docker build -t logoca-nest .
docker run -p 3000:3000 --env-file .env logoca-nest
```

Via `docker-compose.yml` na raiz do projeto (postgres, redis, rabbitmq, kafka, ignite).

## Testes

```bash
npm test
npm run test:e2e
```
