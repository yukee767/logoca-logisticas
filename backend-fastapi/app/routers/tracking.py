"""
app/routers/tracking.py — CRUD Tracking + WebSocket realtime /ws/tracking/{truck_id}
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.tracking import TrackingEvent
from app.schemas.tracking import TrackingCreate, TrackingOut
from app.services.gps_service import gps_service, websocket_endpoint
from app.cache import RedisCache
from app.messaging import RabbitMQPublisher, KafkaProducer

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("/", response_model=List[TrackingOut])
async def list_tracking(
    truck_id: Optional[UUID] = None,
    order_id: Optional[UUID] = None,
    route_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(TrackingEvent)
    if truck_id:
        query = query.where(TrackingEvent.truck_id == truck_id)
    if order_id:
        query = query.where(TrackingEvent.order_id == order_id)
    if route_id:
        query = query.where(TrackingEvent.route_id == route_id)
    query = query.order_by(desc(TrackingEvent.recorded_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()
    return events


@router.get("/truck/{truck_id}", response_model=List[TrackingOut], summary="Histórico por caminhão")
async def list_by_truck(
    truck_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    # tenta Redis history primeiro
    history = await gps_service.get_history(str(truck_id), limit=limit)
    if history:
        # converte para resposta; history já é dict
        return [
            TrackingOut(
                id=h.get("id") or truck_id,
                order_id=h.get("order_id"),
                route_id=h.get("route_id"),
                truck_id=UUID(str(truck_id)),
                latitude=h.get("latitude"),
                longitude=h.get("longitude"),
                speed_kmh=h.get("speed_kmh"),
                event_type=h.get("event_type", "POSITION_UPDATE"),
                description=h.get("description"),
                recorded_at=datetime.fromisoformat(h.get("recorded_at").replace("Z", "+00:00")) if h.get("recorded_at") else datetime.now(timezone.utc),
                created_at=datetime.fromisoformat(h.get("received_at").replace("Z", "+00:00")) if h.get("received_at") else datetime.now(timezone.utc),
            )
            for h in history
            if h.get("latitude") is not None
        ][:limit]

    result = await db.execute(select(TrackingEvent).where(TrackingEvent.truck_id == truck_id).order_by(desc(TrackingEvent.recorded_at)).limit(limit))
    return result.scalars().all()


@router.get("/truck/{truck_id}/last", summary="Última posição (Redis cache)")
async def get_last_position(truck_id: UUID):
    cached = await RedisCache.get_tracking(str(truck_id))
    if not cached:
        raise HTTPException(status_code=404, detail="Nenhuma posição encontrada para este caminhão")
    return cached


@router.get("/{event_id}", response_model=TrackingOut)
async def get_tracking(event_id: UUID, db: AsyncSession = Depends(get_db)):
    event = await db.get(TrackingEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return event


@router.post("/", response_model=TrackingOut, status_code=status.HTTP_201_CREATED)
async def create_tracking(payload: TrackingCreate, db: AsyncSession = Depends(get_db)):
    # Validação truck_id recomendado
    if payload.truck_id is None and payload.order_id is None and payload.route_id is None:
        # permite mas avisa
        pass

    event = TrackingEvent(
        order_id=payload.order_id,
        route_id=payload.route_id,
        truck_id=payload.truck_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kmh=payload.speed_kmh,
        event_type=payload.event_type,
        description=payload.description,
        recorded_at=payload.recorded_at or datetime.now(timezone.utc),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Publica e cacheia
    payload_dict = {
        "id": str(event.id),
        "truck_id": str(event.truck_id) if event.truck_id else None,
        "latitude": str(event.latitude),
        "longitude": str(event.longitude),
        "speed_kmh": str(event.speed_kmh) if event.speed_kmh else None,
        "event_type": event.event_type,
        "order_id": str(event.order_id) if event.order_id else None,
        "route_id": str(event.route_id) if event.route_id else None,
        "recorded_at": event.recorded_at.isoformat(),
    }
    if event.truck_id:
        await RedisCache.set_tracking(str(event.truck_id), payload_dict, ttl=600)
        # broadcast WS se houver clientes
        await gps_service.broadcast(str(event.truck_id), {"type": "position_update", "data": payload_dict})
        # também via GPS service history
        await gps_service.handle_position_update(str(event.truck_id), payload_dict)

    try:
        await RabbitMQPublisher.tracking_event(payload_dict)
        await KafkaProducer.tracking_admin_event(payload_dict)
    except Exception:
        pass

    return event


@router.post("/truck/{truck_id}", response_model=TrackingOut, status_code=status.HTTP_201_CREATED, summary="Cria evento direto por truck_id (REST complementar ao WS)")
async def create_tracking_by_truck(truck_id: UUID, payload: TrackingCreate, db: AsyncSession = Depends(get_db)):
    # injeta truck_id da URL
    payload.truck_id = truck_id
    return await create_tracking(payload, db)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tracking(event_id: UUID, db: AsyncSession = Depends(get_db)):
    event = await db.get(TrackingEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    await db.delete(event)
    await db.commit()
    return None


# ──────────────────────────────────────────────────────────────
# WebSocket — NOTA: este router NÃO registra WS; o WS é registrado em main.py via @app.websocket
# Mas mantemos helper para documentar. O endpoint real está em app.main.
# ──────────────────────────────────────────────────────────────
@router.get("/ws/info", summary="Info WebSocket tracking")
async def ws_info():
    return {
        "websocket_url": "/ws/tracking/{truck_id}",
        "protocol": "websocket",
        "example_client_js": "new WebSocket('ws://localhost:8000/ws/tracking/<truck_uuid>')",
        "send_format": {"latitude": -23.55, "longitude": -46.63, "speed_kmh": 60, "event_type": "POSITION_UPDATE"},
        "connected_trucks": gps_service.connected_trucks(),
    }
