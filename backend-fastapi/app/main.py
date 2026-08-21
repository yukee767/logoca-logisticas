"""
app/main.py — FastAPI app com CORS, routers, healthcheck /health, docs e WebSocket GPS
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
from app.database import engine, Base, get_db
from app.cache import close_redis, close_ignite, get_redis
from app.messaging import close_rabbit, close_kafka
from app.services.gps_service import gps_service, websocket_endpoint

# Routers
from app.routers import products, stock, trucks, routes, tracking, orders

settings = get_settings()
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"🚀 LogoCá FastAPI v{settings.app_version} — ENV={settings.env}")
    # Opcional: cria tabelas se não existirem (dev)
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    logger.info("🛑 Shutdown FastAPI — fechando conexões...")
    await close_redis()
    try:
        close_ignite()
    except Exception:
        pass
    await close_rabbit()
    await close_kafka()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
LogoCá Logísticas — Microsserviço FastAPI

- **Produtos** com `quantity_minimum` validation e preço final `cost_price * 1.20`
- **Estoque** Brahma/Pepsi com alerta mínimo + Redis financeiro
- **Trucks** CRUD `disponivel` / `em_rota` / `manutencao` (AVAILABLE/IN_TRANSIT/MAINTENANCE)
- **Routes** com otimização Haversine e cálculo ETA `distance/60`
- **Tracking GPS** via WebSocket realtime `/ws/tracking/{truck_id}`
- **Orders** B2B/CONSUMER com cálculos JS-style
- **Redis** para dados sensíveis/financeiros + **Ignite** user-cache/admin-cache
- **RabbitMQ** user→empresa + **Kafka** admin eventos

Auth: JWT Bearer (ver `app/utils/security.py`)
    """,
    docs_url="/docs" if settings.enable_swagger else None,
    redoc_url="/redoc" if settings.enable_swagger else None,
    openapi_url="/openapi.json" if settings.enable_swagger else None,
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"] if settings.env == "development" else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(products.router, prefix="/api")
app.include_router(stock.router, prefix="/api")
app.include_router(trucks.router, prefix="/api")
app.include_router(routes.router, prefix="/api")
app.include_router(tracking.router, prefix="/api")
app.include_router(orders.router, prefix="/api")


# ── Healthcheck ──
@app.get("/health", tags=["health"], summary="Healthcheck")
async def healthcheck():
    checks = {"status": "ok", "service": "backend-fastapi", "version": settings.app_version, "env": settings.env}
    # DB check
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "up"
    except Exception as e:
        checks["database"] = f"down: {e}"
        checks["status"] = "degraded"
    # Redis check
    try:
        r = await get_redis()
        await r.ping()
        checks["redis"] = "up"
    except Exception as e:
        checks["redis"] = f"down: {e}"
        # não marca degraded pra não quebrar health em dev sem redis
    # Ignite
    checks["ignite"] = f"{settings.ignite_host}:{settings.ignite_port}"
    checks["kafka"] = ",".join(settings.kafka_brokers_list)
    checks["rabbitmq"] = "configured" if settings.rabbitmq_url else "not configured"
    # WS stats
    checks["ws_connected_trucks"] = gps_service.connected_trucks()
    return checks


@app.get("/", tags=["health"])
async def root():
    return {
        "message": "LogoCá Logísticas — FastAPI",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "api_prefix": "/api",
        "websocket": "/ws/tracking/{truck_id}",
    }


@app.get("/api/health", tags=["health"], include_in_schema=False)
async def api_health():
    return await healthcheck()


# ── WebSocket GPS realtime ──
@app.websocket("/ws/tracking/{truck_id}")
async def ws_tracking(websocket: WebSocket, truck_id: str):
    """
    WebSocket realtime GPS
    - Conecta: `ws://localhost:8000/ws/tracking/<uuid-do-caminhao>`
    - Envia JSON: `{"latitude": -23.55, "longitude": -46.63, "speed_kmh": 72.5, "event_type": "POSITION_UPDATE"}`
    - Recebe ack + broadcast para todos conectados no mesmo truck_id
    - Também persiste via Redis history; POST /api/tracking persiste no Postgres
    """
    await websocket_endpoint(websocket, truck_id)


@app.websocket("/ws/tracking")
async def ws_tracking_generic(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "error", "message": "Use /ws/tracking/{truck_id} com truck_id na URL"})
    await websocket.close(code=1008)


# ── Exception handlers ──
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Erro interno", "error": str(exc) if settings.env == "development" else "internal error"})
