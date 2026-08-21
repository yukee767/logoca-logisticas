# Arquitetura — LogoCá Logísticas

> Documento de arquitetura de software. Stack: NestJS, FastAPI, Angular, Next.js, Postgres 16, Redis 7, RabbitMQ 3, Kafka (Confluent), Apache Ignite 2.15.

---

## 1. Visão Geral

A LogoCá Logísticas opera como um **hub de distribuição B2B e CONSUMER** para bebidas (Brahma, Pepsi etc.) com centros de distribuição (CDs), frota própria, motoristas e rastreamento GPS. A arquitetura é **híbrida modular**: microsserviços lógicos com monorepo físico, mensageria desacoplada e cache distribuído.

### Princípios

- **Separação de escrita transacional vs eventos analíticos:** RabbitMQ para o crítico, Kafka para o volumoso.
- **Cache segregado por domínio:** `user-cache` e `admin-cache` isolados no Ignite.
- **Infra como código:** Docker Compose para dev, Kubernetes para produção.
- **Postgres como fonte da verdade**, Redis/Ignite como aceleração, Kafka/RabbitMQ como barramento.

---

## 2. Diagrama de Componentes

```
                         ┌─────────────────────────────────────────┐
                         │              CLIENTES                    │
                         │  Browser (Angular :4200)                │
                         │  Browser (Next.js  :3001 / Admin)       │
                         │  Mobile / App (futuro)                  │
                         └──────────────┬──────────────────────────┘
                                        │ HTTPS
                         ┌──────────────▼──────────────────────────┐
                         │         INGRESS (nginx)                 │
                         │  app.logoca.local      → Angular        │
                         │  admin.logoca.local    → Next.js        │
                         │  api.logoca.local/nest → NestJS :3000   │
                         │  api.logoca.local/fast → FastAPI :8000  │
                         └──────┬───────────────────┬──────────────┘
                                │                   │
                 ┌──────────────▼──────┐  ┌─────────▼──────────────┐
                 │   NestJS (:3000)    │  │  FastAPI (:8000)       │
                 │  - Auth (JWT)       │  │  - Tracking ingestion  │
                 │  - Users/Companies  │  │  - GPS events          │
                 │  - Orders/Stock     │  │  - Analytics/Reports   │
                 │  - Warehouses       │  │  - Read models         │
                 │  - Trucks/Drivers   │  └──────────┬─────────────┘
                 │  - Routes           │             │
                 └──────┬──┬──┬──┬─────┘             │
                        │  │  │  │                  │
          ┌─────────────┘  │  │  └──────────────────┼─────────────┐
          │                │  │                     │             │
          ▼                ▼  ▼                     ▼             ▼
     ┌─────────┐      ┌────────┐  ┌──────────┐ ┌────────┐  ┌──────────┐
     │Postgres │      │ Redis  │  │ RabbitMQ │ │ Kafka  │  │  Ignite  │
     │  :5432  │      │ :6379  │  │  :5672   │ │ :9092  │  │ :10800   │
     └─────────┘      └────────┘  └──────────┘ └────────┘  └──────────┘
```

---

## 3. Fluxo RabbitMQ — `usuário → empresa` (Transacional)

> **Broker:** RabbitMQ 3-management  
> **Uso:** comunicação **usuário → empresa** (pedidos, notificações transacionais). Semântica de **fila com ACK, retry e DLQ**.

### 3.1 Quando usar RabbitMQ

- Criação/atualização de pedidos (CONSUMER e B2B)
- Notificações que precisam de garantia de entrega (e-mail, push, estoque mínimo)
- Orquestração entre NestJS e workers/consumers

### 3.2 Topologia

```
Exchange: logoca.direct (direct, durable)
  ├─ routing_key: order.created      → queue: orders.created.q
  ├─ routing_key: order.confirmed    → queue: orders.confirmed.q
  ├─ routing_key: order.status       → queue: orders.status.q
  ├─ routing_key: stock.alert        → queue: stock.alert.q
  ├─ routing_key: notification.send  → queue: notifications.q
  └─ DLX: logoca.dlx (fanout) → queue: logoca.dlq (dead-letter)

Exchange: logoca.notifications (topic, durable)
  ├─ routing_key: notification.#     → queue: notifications.q
```

**Durabilidade:** exchanges e filas `durable=true`, mensagens `persistent=true`, `manual ACK`.

### 3.3 Fluxo detalhado

```
1. [Angular B2B] POST /orders (B2B) ──► [NestJS] valida → salva Postgres (status PENDING)
2. NestJS publica em RabbitMQ:
     exchange=logoca.direct, routing_key=order.created
     payload: { orderId, code, type: "B2B", companyId, items, totalAmount }
3. Consumer NestJS (ou worker separado) consome queue orders.created.q:
     - reserva estoque (stock.reserved_quantity)
     - cria/atualiza route se necessário
     - publica order.confirmed → orders.confirmed.q
4. Consumer de Notificação consome orders.confirmed.q:
     - cria registro em notifications (type=ORDER_UPDATE)
     - publica notification.send → notifications.q
     - worker de e-mail consome notifications.q → envia via SMTP
5. Em caso de falha: NACK + requeue (até 3x) → DLQ (logoca.dlq) para análise manual
```

**Exemplo de publish (NestJS):**

```ts
await amqpChannel.publish(
  'logoca.direct',
  'order.created',
  Buffer.from(JSON.stringify({ orderId, code, type, companyId })),
  { persistent: true, contentType: 'application/json' }
);
```

**Fluxo CONSUMER é idêntico**, mas `type=CONSUMER`, `company_id=null`, `customer_id` preenchido.

### 3.4 Garantias

- **At-least-once** com idempotência por `order.code` / `idempotency-key` header.
- **Retry com backoff** via `x-delayed-message` plugin ou `setTimeout` + requeue.
- **DLQ** para poison messages.

---

## 4. Fluxo Kafka — `admin` (Eventos / Streaming)

> **Broker:** Kafka (Confluent 7.5) + Zookeeper  
> **Uso:** eventos de domínio para área **admin**, auditoria, projeções, ETL e rastreamento GPS. Semântica de **log distribuído, alta vazão, replay**.

### 4.1 Quando usar Kafka

- Eventos de domínio amplos: `admin.order.*`, `admin.stock.*`, `admin.route.*`, `admin.tracking.*`
- Ingestão de `tracking_events` (GPS lat/lng) — alto volume, ordenado por `route_id`/`truck_id`
- Projeções para dashboards admin (Next.js consome via FastAPI que lê do Kafka/Ignite)
- Auditoria e reprocessamento

### 4.2 Tópicos

| Tópico | Partições | Key | Descrição |
|---|---|---|---|
| `admin.orders` | 6 | `orderId` | Criação/atualização de pedidos |
| `admin.stock` | 3 | `warehouseId` | Movimentação de estoque |
| `admin.routes` | 3 | `routeId` | Mudanças de rota/status |
| `admin.tracking` | 12 | `routeId` ou `truckId` | Eventos GPS (lat/lng, speed, timestamp) |
| `admin.notifications` | 3 | `userId` | Notificações para projeção admin |

- `replication.factor=1` (dev) / `3` (prod)
- `retention.ms=604800000` (7 dias) — ajustável por tópico
- `cleanup.policy=delete` (tracking) / `compact` (stock snapshot futuro)

### 4.3 Fluxo detalhado

```
1. [NestJS] após commit Postgres de pedido/estoque:
     kafkaProducer.send({
       topic: 'admin.orders',
       messages: [{ key: orderId, value: JSON.stringify({ event: 'ORDER_CREATED', orderId, type, status, ... }) }]
     })

2. [FastAPI Tracking] POST /tracking/events (GPS do caminhão/app motorista):
     - valida → persiste em tracking_events (Postgres)
     - publica em admin.tracking: { routeId, truckId, latitude, longitude, speed_kmh, recorded_at }

3. Consumers Kafka:
     a) admin-orders-consumer (NestJS ou FastAPI):
        - atualiza Ignite admin-cache (dashboard)
        - alimenta Redis para cache de leitura
     b) tracking-consumer (FastAPI):
        - agrega por rota (última posição, ETA)
        - escreve em Ignite admin-cache para mapa em tempo real
     c) audit-consumer:
        - persiste em tópico compactado ou S3/Data Lake (futuro)

4. [Next.js Admin] GET /api/admin/dashboard:
     → FastAPI lê de Ignite admin-cache (ou Postgres se miss)
     → retorna métricas agregadas sem bater no Postgres transactional
```

**Exemplo de produce (NestJS / kafkajs):**

```ts
await producer.send({
  topic: 'admin.orders',
  messages: [{ key: order.id, value: JSON.stringify({ event: 'ORDER_CREATED', order }) }],
});
```

**Consumer group:** `logoca-admin-group`, `logoca-tracking-group`, `logoca-audit-group` (cada um com offset independente, permitindo replay).

### 4.4 Diferença RabbitMQ vs Kafka (resumo)

| Aspecto | RabbitMQ | Kafka |
|---|---|---|
| Papel | Fila transacional user→empresa | Log de eventos admin |
| Semântica | Queue com ACK, DLQ | Log particionado, offset, replay |
| Garantia | At-least-once + DLQ | At-least-once, ordenado por key |
| Caso de uso | Pedidos, notificações críticas | Dashboards, GPS, auditoria, ETL |
| Consumidor | Competing consumers (1 msg → 1 consumer) | Consumer groups (1 msg → N groups) |

> **Regra prática:** se precisa de **resposta transacional garantida para um único consumidor**, use **RabbitMQ**. Se precisa de **broadcast, replay e alta vazão para múltiplos consumidores**, use **Kafka**.

---

## 5. Apache Ignite — Separação `user` vs `admin`

> **Versão:** 2.15.0  
> **Modo:** thin client (`:10800`), `user-cache` e `admin-cache` como caches distintos (sem interferência).

### 5.1 Por que Ignite e não só Redis?

- **Redis:** cache efêmero, sessão, rate limit, filas leves — ótimo para TTL curto e estruturas simples.
- **Ignite:** cache distribuído com **SQL distribuído, compute grid e persistência opcional** — ideal para **projeções admin** e **estado de tracking** que precisam de queries e partição.

Ambos coexistem. Redis para o quente e volátil, Ignite para o distribuído e consultável.

### 5.2 Caches

| Cache | Nome | Uso | TTL / Eviction | Quem escreve | Quem lê |
|---|---|---|---|---|---|
| **user-cache** | `user-cache` | Sessões, carrinhos, preferência, últimos pedidos do usuário, rate limit por user | TTL 30min–2h, LRU | NestJS (auth, cart, orders) | NestJS, Angular (via API) |
| **admin-cache** | `admin-cache` | Dashboard métricas, agregações de estoque, última posição por rota/caminhão, relatórios pré-computados | TTL 5–15min, ou invalidação por evento Kafka | Consumers Kafka (admin.*), FastAPI | FastAPI, Next.js (admin) |

**Configuração Ignite (exemplo de criação via thin client):**

```sql
-- via ignite thin client ou REST
CREATE CACHE "user-cache" WITH "template=partitioned,backups=1,cacheMode=PARTITIONED,atomicityMode=ATOMIC";
CREATE CACHE "admin-cache" WITH "template=partitioned,backups=1,cacheMode=PARTITIONED,atomicityMode=ATOMIC";
```

Ou via código (Node.js `apache-ignite-client` / Python `pyignite`):

```js
// NestJS — user-cache
await igniteClient.getOrCreateCache('user-cache');
await userCache.put(`session:${userId}`, sessionData);

// FastAPI — admin-cache
client.get_or_create_cache('admin-cache')
cache.put(f"route:{routeId}:last_position", {"lat": -23.55, "lng": -46.63, "at": "2026-01-01T12:00:00Z"})
```

### 5.3 Isolamento

- **Chaves com prefixo** (`user:` vs `admin:`) + **caches físicos separados** — evita contaminação.
- **Políticas de eviction independentes:** `user-cache` pode ter `maxSize` maior e TTL mais longo; `admin-cache` tem TTL curto e invalidação ativa por evento Kafka.
- **Segurança:** em produção, habilitar `IGNITE_AUTHENTICATION_ENABLED` e ACLs por cache.

### 5.4 Fluxo de invalidação

```
Evento Kafka admin.orders → consumer invalida/atualiza admin-cache:
  admin-cache: dashboard:orders:today → recalcula
  admin-cache: warehouse:{id}:stock → atualiza

Evento RabbitMQ order.created → NestJS invalida user-cache:
  user-cache: user:{id}:orders → delete
  user-cache: cart:{id} → delete
```

---

## 6. Banco de Dados — Postgres 16

Fonte da verdade. Schema em `infra/postgres/init.sql`. Highlights:

- **products:** `minimum_quantity` (alerta de reposição) + `cost_price` (margem) — ver `docs` e `init.sql`.
- **stock:** `(warehouse_id, product_id)` único, `quantity` e `reserved_quantity` para reserva de pedidos.
- **trucks:** `placa` (Mercosul), `capacidade_kg/m3`, `status` (AVAILABLE, IN_TRANSIT, MAINTENANCE).
- **routes:** `origem`, `destino`, `status`, `truck_id`, `driver_id` — FKs para rastreamento.
- **orders:** `type` (CONSUMER vs B2B), `company_id` para B2B, `route_id` para vínculo logístico.
- **tracking_events:** `latitude`, `longitude`, `recorded_at` — particionável por mês em produção.
- **notifications:** `type`, `is_read`, vínculo opcional com `order_id`/`route_id`.

Índices em `tracking_events(recorded_at)`, `notifications(user_id)`, `products(brand)`.

---

## 7. Segurança

- JWT `access` (7d) + `refresh` (30d), `BCRYPT_ROUNDS=10`.
- Secrets via `infra/kubernetes/secrets.yaml` (trocar em produção; usar SealedSecrets/ExternalSecrets).
- CORS restrito a `app.logoca.local` / `admin.logoca.local` em prod.
- Ignite e RabbitMQ com autenticação (não expor fora da `logoca-network` / `ClusterIP` no K8s).

---

## 8. Observabilidade (futuro)

- Logs JSON (NestJS pino, FastAPI structlog) → Loki/ELK.
- Métricas: Prometheus + Grafana (Kafka lag, RabbitMQ queue depth, Ignite cache hit ratio).
- Tracing: OpenTelemetry (NestJS + FastAPI → Jaeger).

---

## 9. Referências

- `docker-compose.yml` — orquestração local
- `infra/kubernetes/` — manifests K8s
- `infra/postgres/init.sql` — schema + seeds (Brahma, Pepsi)
- `.env.example` — variáveis
- `README.md` — como rodar

Dúvidas: **logocalogisticas@contato.com**
