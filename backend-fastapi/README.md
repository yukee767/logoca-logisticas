# LogoCá Logísticas — FastAPI

Microsserviço **FastAPI (Python 3.11)** para tracking GPS realtime, otimização de rotas, controle de estoque Brahma/Pepsi e cálculos financeiros.

## Rodar local

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# docs: http://localhost:8000/docs
# health: http://localhost:8000/health
```

## Docker

```bash
docker-compose up -d --build backend-fastapi
```

## Endpoints

- `GET /health` — healthcheck (db/redis/ignite/kafka)
- `GET /docs` — Swagger
- `/api/products` — CRUD + `GET /brahma-pepsi` + finance
- `/api/stock` — CRUD + `GET /alerts` + Brahma/Pepsi + reserve/consume
- `/api/trucks` — CRUD + `PATCH /{id}/status` (disponivel/em_rota/manutencao)
- `/api/routes` — CRUD + `POST /{id}/optimize` + `GET /{id}/eta` + Haversine
- `/api/orders` — CRUD B2B/CONSUMER + cálculos `cost*1.20`
- `/api/tracking` — CRUD + `GET /truck/{id}/last` + `GET /ws/info`
- `WS /ws/tracking/{truck_id}` — GPS realtime (broadcast por truck)

## Stack

FastAPI, SQLAlchemy async + asyncpg, Alembic, Redis (finance حساس), Ignite (user-cache/admin-cache), aio-pika (RabbitMQ user→empresa), aiokafka/kafka-python (Kafka admin), JWT `python-jose` + `passlib`

## Regras

- `minimum_quantity` validation (`ge=0`)
- Preço final `cost_price * 1.20` (20% armazenamento) — JS `toFixed(2)` via Decimal
- Trucks status `disponivel`→`AVAILABLE`, `em_rota`→`IN_TRANSIT`, `manutencao`→`MAINTENANCE`
- Routes ETA `distance/60` horas + `freight = 50 + 2.5*distance + 0.8*weight`
