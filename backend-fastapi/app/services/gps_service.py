"""
app/services/gps_service.py — WebSocket realtime /ws/tracking/{truck_id}
Gerencia conexões por truck_id, broadcast, persistência e cache Redis
"""
import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Set, Any, Optional
from uuid import UUID, uuid4

from fastapi import WebSocket, WebSocketDisconnect

from app.cache import RedisCache
from app.messaging import RabbitMQPublisher, KafkaProducer

logger = logging.getLogger(__name__)


class GPSService:
    """
    Gerenciador WebSocket por caminhão.
    Cada truck_id tem um set de WebSockets conectados.
    Suporta broadcast de posição e histórico via Redis.
    """

    def __init__(self):
        # truck_id (str) -> set[WebSocket]
        self._connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, truck_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[truck_id].add(websocket)
        logger.info(f"[WS] truck {truck_id} conectado. Total: {len(self._connections[truck_id])}")
        # Envia última posição cacheada se existir
        last = await RedisCache.get_tracking(truck_id)
        if last:
            try:
                await websocket.send_json({"type": "last_position", "data": last})
            except Exception:
                pass

    async def disconnect(self, truck_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            conns = self._connections.get(truck_id)
            if conns and websocket in conns:
                conns.remove(websocket)
                if not conns:
                    self._connections.pop(truck_id, None)
        logger.info(f"[WS] truck {truck_id} desconectado. Restantes: {len(self._connections.get(truck_id, []))}")

    async def broadcast(self, truck_id: str, payload: Dict[str, Any]) -> None:
        """Broadcast para todos os clientes do truck_id"""
        conns = list(self._connections.get(truck_id, set()))
        if not conns:
            return
        message = json.dumps(payload, default=str)
        disconnected = []
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception as e:
                logger.warning(f"[WS] send falhou truck {truck_id}: {e}")
                disconnected.append(ws)
        # cleanup
        if disconnected:
            async with self._lock:
                for ws in disconnected:
                    self._connections[truck_id].discard(ws)

    async def handle_position_update(self, truck_id: str, data: Dict[str, Any], db_session=None) -> Dict[str, Any]:
        """
        Valida, persiste (via caller), cacheia no Redis, publica em brokers e faz broadcast
        """
        # Normaliza
        payload = {
            "id": str(uuid4()),
            "truck_id": truck_id,
            "latitude": str(data.get("latitude")),
            "longitude": str(data.get("longitude")),
            "speed_kmh": str(data.get("speed_kmh")) if data.get("speed_kmh") is not None else None,
            "event_type": data.get("event_type", "POSITION_UPDATE"),
            "order_id": str(data.get("order_id")) if data.get("order_id") else None,
            "route_id": str(data.get("route_id")) if data.get("route_id") else None,
            "description": data.get("description"),
            "recorded_at": data.get("recorded_at") or datetime.now(timezone.utc).isoformat(),
            "received_at": datetime.now(timezone.utc).isoformat(),
        }

        # Validação básica
        try:
            lat = Decimal(str(payload["latitude"]))
            lng = Decimal(str(payload["longitude"]))
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                raise ValueError("coordenadas fora do intervalo")
        except Exception as e:
            raise ValueError(f"latitude/longitude inválidos: {e}")

        # Cache Redis (última posição)
        await RedisCache.set_tracking(truck_id, payload, ttl=600)

        # Histórico curto no Redis List (últimas 100 posições)
        try:
            from app.cache import get_redis

            r = await get_redis()
            key = f"tracking:history:{truck_id}"
            await r.lpush(key, json.dumps(payload, default=str))
            await r.ltrim(key, 0, 99)
            await r.expire(key, 3600)
        except Exception as e:
            logger.warning(f"Redis history falhou: {e}")

        # Brokers (fire-and-forget)
        try:
            await RabbitMQPublisher.tracking_event(payload)
        except Exception as e:
            logger.warning(f"Rabbit tracking falhou: {e}")
        try:
            await KafkaProducer.tracking_admin_event(payload)
        except Exception as e:
            logger.warning(f"Kafka tracking falhou: {e}")

        # Broadcast WS
        await self.broadcast(truck_id, {"type": "position_update", "data": payload})

        return payload

    async def get_history(self, truck_id: str, limit: int = 20) -> list[Dict[str, Any]]:
        try:
            from app.cache import get_redis

            r = await get_redis()
            key = f"tracking:history:{truck_id}"
            vals = await r.lrange(key, 0, limit - 1)
            return [json.loads(v) for v in vals]
        except Exception:
            return []

    def connected_trucks(self) -> Dict[str, int]:
        return {tid: len(conns) for tid, conns in self._connections.items()}


# Singleton global
gps_service = GPSService()


async def websocket_endpoint(websocket: WebSocket, truck_id: str, db_session=None):
    """
    Endpoint function para ser usada no router.
    Mantém loop de recepção até disconnect.
    """
    await gps_service.connect(truck_id, websocket)
    try:
        while True:
            # Recebe JSON do cliente (motorista enviando GPS)
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "JSON inválido"})
                continue

            # Se for ping
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                continue

            # Posição — aceita tanto {latitude, longitude} direto quanto {data: {...}}
            payload_data = data.get("data") if "data" in data and isinstance(data["data"], dict) else data
            # Injeta truck_id se não vier
            if "truck_id" not in payload_data:
                payload_data["truck_id"] = truck_id

            try:
                result = await gps_service.handle_position_update(truck_id, payload_data, db_session)
                # Opcional: persistir no Postgres — caller pode fazer; aqui só confirma
                await websocket.send_json({"type": "ack", "data": result})
            except ValueError as e:
                await websocket.send_json({"type": "error", "message": str(e)})
            except Exception as e:
                logger.error(f"WS handle error: {e}")
                await websocket.send_json({"type": "error", "message": "erro interno"})
    except WebSocketDisconnect:
        await gps_service.disconnect(truck_id, websocket)
    except Exception as e:
        logger.error(f"WS endpoint erro truck {truck_id}: {e}")
        await gps_service.disconnect(truck_id, websocket)
