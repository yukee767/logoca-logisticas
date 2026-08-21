# LogoCá Logísticas

Plataforma de logística e distribuição para bebidas (Brahma, Pepsi e parceiros) com gestão de estoque, frota, rotas, pedidos B2B/CONSUMER e rastreamento GPS em tempo real.
 
> **Contato:** [logocalogisticas@contato.com](mailto:logocalogisticas@contato.com) (FICCIONAL)

LEMBRETE: O SITE É APENAS PARA PORTIFÓLIO, NÃO CONDIZ COM NENHUM CNPJ REGISTRADO NO BRASIL. QUALQUER SEMELHANÇA É MERA COINCIDÊNCIA.
---

## Índice

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Diagrama Textual](#diagrama-textual)
- [Pré-requisitos](#pré-requisitos)
- [Como Rodar — Docker Compose](#como-rodar--docker-compose)
- [Como Rodar — Kubernetes](#como-rodar--kubernetes)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Desenvolvimento](#desenvolvimento)

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Frontend Cliente** | Angular 17+ (SPA) |
| **Frontend Admin** | Next.js 14+ (SSR/SSG) |
| **Backend Principal** | NestJS (Node.js) |
| **Backend Secundário** | FastAPI (Python) |
| **Banco Relacional** | PostgreSQL 16 |
| **Cache / Session** | Redis 7 |
| **Mensageria Transacional** | RabbitMQ 3 (management) |
| **Streaming / Eventos** | Kafka + Zookeeper (Confluent 7.5) |
| **Cache Distribuído** | Apache Ignite 2.15 |
| **Infra Local** | Docker Compose |
| **Infra Produção** | Kubernetes (manifests em `infra/kubernetes/`) |
| **Auth** | JWT (access + refresh) |

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTENDS                                     │
│  Angular (:4200)  ──────────►  Usuários finais (CONSUMER / B2B)     │
│  Next.js  (:3001) ──────────►  Admin / Dashboard Gerencial           │
└──────────────┬───────────────────────┬────────────────────────────────┘
               │                       │
               ▼                       ▼
┌──────────────────────┐   ┌──────────────────────┐
│   NestJS (:3000)     │   │  FastAPI (:8000)     │
│  - Auth / Users      │   │  - Analytics         │
│  - Orders / Stock    │   │  - Tracking / GPS    │
│  - RabbitMQ Producer │   │  - Relatórios        │
│  - Kafka Producer    │   └──────────┬───────────┘
└──────┬───────┬───────┘              │
       │       │                      │
       │       └──────────┬───────────┘
       │                  │
       ▼                  ▼
┌─────────────────────────────────────────┐
│           INFRA COMPARTILHADA           │
│  Postgres 16  ── dados relacionais      │
│  Redis 7      ── cache / sessions       │
│  RabbitMQ     ── fila user→empresa     │
│  Kafka        ── eventos admin          │
│  Ignite 2.15  ── cache distribuído      │
│                 (user-cache / admin-cache) │
└─────────────────────────────────────────┘
```

### Separação de responsabilidades

- **NestJS** — API principal, regras de negócio, autenticação, pedidos, estoque, integração RabbitMQ (transacional) e Kafka (eventos admin).
- **FastAPI** — serviços de alta performance: ingestão de tracking GPS, analytics, relatórios e endpoints de leitura otimizada.
- **RabbitMQ** — fluxo **usuário → empresa** (pedidos, notificações transacionais). Garante entrega e retry.
- **Kafka** — fluxo **admin** (eventos de domínio, auditoria, ETL, projeções). Alta vazão e replay.
- **Ignite** — cache distribuído com separação física: `user-cache` (sessões, carrinhos) vs `admin-cache` (dashboards, métricas).

Detalhes completos em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

---

## Diagrama Textual

```
[Cliente Browser] ──► [Angular] ──► [NestJS] ──► [Postgres]
                                    │    │
                                    │    ├──► [Redis] (cache)
                                    │    ├──► [RabbitMQ] ──► [Consumer: Orders/Notifications]
                                    │    ├──► [Kafka] ──► [Consumer: Admin/ETL]
                                    │    └──► [Ignite:user-cache]
                                    │
[Admin Browser] ──► [Next.js] ──► [NestJS + FastAPI] ──► [Postgres/Redis]
                                    │         │
                                    │         └──► [Ignite:admin-cache]
                                    └────────────► [Kafka: tópicos admin.*]
                                                 └► [TrackingEvents → Kafka → FastAPI]

Infra Docker Compose: todos os serviços em logoca-network, volumes persistentes, healthchecks.
Infra K8s: namespace logoca, Deployments + StatefulSet (Postgres), Services, Ingress (nginx), ConfigMap, Secrets, PVCs.
```

---

## Pré-requisitos

- Docker 24+ e Docker Compose v2
- Node.js 20+ (para frontends/backend Nest)
- Python 3.11+ (para FastAPI)
- kubectl + cluster K8s (kind, minikube, EKS/GKE) — apenas para deploy K8s

---

## Como Rodar — Docker Compose

```bash
# 1. Clone o repositório
git clone <repo-url> "LogoCá Logísticas"
cd "LogoCá Logísticas"

# 2. Configure variáveis
cp .env.example .env
# Edite .env se necessário

# 3. Suba toda a infraestrutura + apps
docker-compose up -d --build

# 4. Acompanhe logs
docker-compose logs -f

# 5. Verifique saúde dos serviços
docker-compose ps
curl http://localhost:3000/health   # NestJS
curl http://localhost:8000/health   # FastAPI
curl http://localhost:4200          # Angular
curl http://localhost:3001          # Next.js

# RabbitMQ Management
open http://localhost:15672  # user: logoca / pass: logoca123

# 6. Parar
docker-compose down
# Para remover volumes: docker-compose down -v
```

### Serviços e portas (padrão)

| Serviço | Porta Host |
|---|---|
| Postgres | 5432 |
| Redis | 6379 |
| RabbitMQ (AMQP) | 5672 |
| RabbitMQ Management | 15672 |
| Kafka | 9092 |
| Zookeeper | 2181 |
| Ignite (thin client) | 10800 |
| NestJS | 3000 |
| FastAPI | 8000 |
| Angular | 4200 |
| Next.js | 3001 |

---

## Como Rodar — Kubernetes

```bash
# 1. Crie o namespace, configmaps e secrets
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secrets.yaml

# 2. Crie o ConfigMap do init.sql (ou use o manifest)
kubectl create configmap postgres-init --from-file=infra/postgres/init.sql -n logoca --dry-run=client -o yaml | kubectl apply -f -

# 3. Suba a infra (ordem importa por dependências)
kubectl apply -f infra/kubernetes/postgres-statefulset.yaml
kubectl apply -f infra/kubernetes/redis-deployment.yaml
kubectl apply -f infra/kubernetes/rabbitmq-deployment.yaml
kubectl apply -f infra/kubernetes/kafka-deployment.yaml
kubectl apply -f infra/kubernetes/ignite-deployment.yaml

# Aguarde ficar Ready
kubectl wait --for=condition=ready pod -l app=postgres -n logoca --timeout=180s

# 4. Suba os backends
kubectl apply -f infra/kubernetes/nest-deployment.yaml
kubectl apply -f infra/kubernetes/fastapi-deployment.yaml

# 5. Suba os frontends
kubectl apply -f infra/kubernetes/angular-deployment.yaml
kubectl apply -f infra/kubernetes/next-deployment.yaml

# 6. Ingress (requer ingress-nginx instalado)
kubectl apply -f infra/kubernetes/ingress.yaml

# 7. Verifique
kubectl get pods,svc,ingress -n logoca
kubectl logs -f deploy/backend-nest -n logoca

# Port-forward para teste local sem ingress
kubectl port-forward svc/backend-nest 3000:3000 -n logoca
kubectl port-forward svc/frontend-angular 4200:80 -n logoca
```

### Instalar ingress-nginx (se necessário)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
# ou
helm upgrade --install ingress-nginx ingress-nginx --repo https://kubernetes.github.io/ingress-nginx --namespace ingress-nginx --create-namespace
```

Adicione ao `/etc/hosts` (ou `C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 app.logoca.local admin.logoca.local logoca.local api.logoca.local
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env`. Principais variáveis:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL Postgres (Nest + FastAPI) |
| `REDIS_URL` | URL Redis |
| `RABBITMQ_URL` | URL AMQP RabbitMQ |
| `KAFKA_BROKERS` | Lista de brokers Kafka |
| `IGNITE_URL` / `IGNITE_HOST` | Endereço Apache Ignite |
| `JWT_SECRET` | Segredo JWT |
| `JWT_EXPIRES_IN` | Expiração do token |

Veja `.env.example` para lista completa.

---

## Banco de Dados

O schema é criado automaticamente via `infra/postgres/init.sql` (montado em `/docker-entrypoint-initdb.d`).

### Tabelas principais

`companies`, `users`, `warehouses`, `products` (com `minimum_quantity`, `cost_price`), `stock`, `trucks` (placa, capacidade, status), `drivers`, `routes` (origem, destino, status, truck_id, driver_id), `orders` (CONSUMER vs B2B), `order_items`, `tracking_events` (gps lat/lng, timestamp), `notifications`.

### Seeds inclusos

- **Empresas:** Ambev - Brahma, PepsiCo Brasil, LogoCá Logísticas, Supermercado Central B2B, Distribuidora Paulista
- **Produtos:** 12 produtos com `minimum_quantity` e `cost_price` (Brahma lata 350ml, latão 473ml, garrafa 600ml, caixa 12x, Duplo Malte; Pepsi lata 350ml, 2L, 1L, caixa 12x, Black; Água, Suco)
- **Warehouses:** CD SP Central, CD Campinas, CD Santos
- **Frota:** 3 caminhões, 2 motoristas, 2 rotas, 2 pedidos (CONSUMER e B2B) + eventos de tracking e notificações

Recriar banco do zero:

```bash
docker-compose down -v
docker-compose up -d postgres
docker-compose logs postgres
```

---

## Estrutura de Pastas

```
.
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── docs/
│   └── ARQUITETURA.md
├── infra/
│   ├── postgres/
│   │   └── init.sql
│   └── kubernetes/
│       ├── namespace.yaml
│       ├── configmap.yaml
│       ├── secrets.yaml
│       ├── postgres-statefulset.yaml
│       ├── redis-deployment.yaml
│       ├── rabbitmq-deployment.yaml
│       ├── kafka-deployment.yaml
│       ├── ignite-deployment.yaml
│       ├── nest-deployment.yaml
│       ├── fastapi-deployment.yaml
│       ├── angular-deployment.yaml
│       ├── next-deployment.yaml
│       └── ingress.yaml
├── backend-nest/        # NestJS
├── backend-fastapi/     # FastAPI
├── frontend-angular/    # Angular
└── frontend-next/       # Next.js
```

---

## Desenvolvimento

```bash
# Backend Nest
cd backend-nest && npm install && npm run start:dev

# Backend FastAPI
cd backend-fastapi && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# Frontend Angular
cd frontend-angular && npm install && npm start

# Frontend Next
cd frontend-next && npm install && npm run dev
```

---

## Licença

Proprietário — Yukee767. Todos os direitos reservados.

Dúvidas sobre como o projeto foi feito? Me mande um email victorlima124tt@gmail.com ou entre em contato pelo discord yukee676.
