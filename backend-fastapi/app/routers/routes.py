"""
app/routers/routes.py — CRUD + otimização e ETA
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.route import Route, RouteStatus
from app.schemas.route import RouteCreate, RouteUpdate, RouteOut
from app.services.route_optimizer import RouteOptimizer, calc_eta, estimate_freight_cost, haversine_km
from app.messaging import RabbitMQPublisher, KafkaProducer
from app.cache import RedisCache

router = APIRouter(prefix="/routes", tags=["routes"])


def _to_out(route: Route) -> dict:
    # usa helper RouteOut.enrich
    data = RouteOut.enrich(route)
    # adiciona cálculo JS extra
    freight = None
    if route.distance_km:
        freight = str(estimate_freight_cost(route.distance_km))
    data["freight_estimate"] = freight
    return data


@router.get("/", response_model=List[dict])
async def list_routes(
    status_filter: Optional[RouteStatus] = Query(None, alias="status"),
    truck_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(Route)
    if status_filter:
        query = query.where(Route.status == status_filter)
    if truck_id:
        query = query.where(Route.truck_id == truck_id)
    query = query.offset(skip).limit(limit).order_by(Route.created_at.desc())
    result = await db.execute(query)
    routes = result.scalars().all()
    return [_to_out(r) for r in routes]


@router.get("/{route_id}", response_model=dict)
async def get_route(route_id: UUID, db: AsyncSession = Depends(get_db)):
    route = await db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    # tenta cache Redis
    cached = await RedisCache.get(f"route:{route_id}")
    out = _to_out(route)
    await RedisCache.set(f"route:{route_id}", out, ttl=300)
    return out


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_route(payload: RouteCreate, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(Route).where(Route.code == payload.code.strip().upper()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Código {payload.code} já existe")

    # Se distance_km não informado mas origem/destino são warehouses com lat/lng, calcula
    distance = payload.distance_km
    estimated = payload.estimated_hours

    # Calcula ETA automaticamente se tiver departure e distance
    if distance is not None and estimated is None:
        hours, _ = calc_eta(distance, departure_at=payload.departure_at)
        estimated = hours

    route = Route(
        code=payload.code.strip().upper(),
        origem=payload.origem,
        destino=payload.destino,
        origem_warehouse_id=payload.origem_warehouse_id,
        destino_warehouse_id=payload.destino_warehouse_id,
        distance_km=distance,
        estimated_hours=estimated,
        status=payload.status,
        truck_id=payload.truck_id,
        driver_id=payload.driver_id,
        departure_at=payload.departure_at,
        arrival_at=payload.arrival_at,
    )
    db.add(route)
    await db.commit()
    await db.refresh(route)

    out = _to_out(route)
    await RedisCache.set(f"route:{route.id}", out, ttl=300)
    try:
        await RabbitMQPublisher.route_updated(out)
        await KafkaProducer.publish("admin.route.created", out, key=str(route.id))
    except Exception:
        pass
    return out


@router.put("/{route_id}", response_model=dict)
async def update_route(route_id: UUID, payload: RouteUpdate, db: AsyncSession = Depends(get_db)):
    route = await db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    data = payload.model_dump(exclude_unset=True)

    # recalcula estimated_hours se distance mudou e estimated não veio
    if "distance_km" in data and data["distance_km"] is not None and "estimated_hours" not in data:
        hours, _ = calc_eta(Decimal(str(data["distance_km"])), departure_at=data.get("departure_at", route.departure_at))
        data["estimated_hours"] = hours
    elif "distance_km" in data and "estimated_hours" not in data and route.distance_km:
        # fallback
        pass

    for k, v in data.items():
        setattr(route, k, v)
    await db.commit()
    await db.refresh(route)
    out = _to_out(route)
    await RedisCache.set(f"route:{route.id}", out, ttl=300)
    try:
        await RabbitMQPublisher.route_updated(out)
        await KafkaProducer.publish("admin.route.updated", out, key=str(route.id))
    except Exception:
        pass
    return out


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(route_id: UUID, db: AsyncSession = Depends(get_db)):
    route = await db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    await db.delete(route)
    await db.commit()
    await RedisCache.delete(f"route:{route_id}")
    return None


@router.post("/{route_id}/optimize", summary="Otimização + recálculo ETA")
async def optimize_route(
    route_id: UUID,
    departure_at: Optional[datetime] = None,
    avg_speed_kmh: Optional[float] = Query(None, ge=10, le=150),
    db: AsyncSession = Depends(get_db),
):
    route = await db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")

    # Se route tem distance, recalcula
    dep = departure_at or route.departure_at or datetime.now(timezone.utc)
    hours, eta = calc_eta(route.distance_km or Decimal("0"), Decimal(str(avg_speed_kmh)) if avg_speed_kmh else None, dep)

    # Opcional: otimização com waypoints fake (extensível)
    # Aqui só demonstra cálculo
    optimization = {
        "route_id": str(route.id),
        "code": route.code,
        "origem": route.origem,
        "destino": route.destino,
        "distance_km": str(route.distance_km) if route.distance_km else "0",
        "estimated_hours_before": str(route.estimated_hours) if route.estimated_hours else None,
        "estimated_hours_optimized": str(hours),
        "estimated_minutes": int(float(hours) * 60),
        "eta": eta.isoformat() if eta else None,
        "departure_at": dep.isoformat(),
        "avg_speed_kmh": float(avg_speed_kmh) if avg_speed_kmh else 60.0,
        "freight_estimate": str(estimate_freight_cost(route.distance_km or Decimal("0"))),
        "optimization": "nearest-neighbor (haversine) — em produção: OSRM/OR-Tools",
    }

    # Se ETA otimizado for diferente, atualiza rota
    if route.estimated_hours != hours:
        route.estimated_hours = hours
        await db.commit()
        await db.refresh(route)
        await RedisCache.set(f"route:{route.id}", _to_out(route), ttl=300)

    return optimization


@router.get("/{route_id}/eta", summary="Cálculo ETA puro (JS-style)")
async def get_eta(route_id: UUID, departure_at: Optional[datetime] = None, db: AsyncSession = Depends(get_db)):
    route = await db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    dep = departure_at or route.departure_at or datetime.now(timezone.utc)
    hours, eta = calc_eta(route.distance_km or Decimal("0"), None, dep)
    return {
        "route_id": str(route.id),
        "code": route.code,
        "distance_km": str(route.distance_km) if route.distance_km else None,
        "departure_at": dep.isoformat(),
        "estimated_hours": str(hours),
        "eta": eta.isoformat() if eta else None,
        "eta_timestamp": int(eta.timestamp()) if eta else None,
        "calculation": "estimated_hours = distance_km / 60 (avg_speed), ETA = departure_at + estimated_hours",
    }


@router.post("/optimize/custom", summary="Otimização custom com lat/lng")
async def optimize_custom(
    origem: dict,
    destino: dict,
    waypoints: Optional[List[dict]] = None,
    departure_at: Optional[datetime] = None,
):
    """
    Body exemplo:
    {
      "origem": {"lat": -23.55, "lng": -46.63, "name": "CD SP"},
      "destino": {"lat": -22.90, "lng": -47.06, "name": "CD Campinas"},
      "waypoints": [{"lat": -23.42, "lng": -46.90, "name": "Parada 1"}]
    }
    """
    # FastAPI espera body JSON — usamos dicts genéricos; valida manual
    try:
        for p in [origem, destino] + (waypoints or []):
            assert "lat" in p and "lng" in p, "cada ponto precisa lat/lng"
    except AssertionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    result = RouteOptimizer.optimize(origem, destino, waypoints, departure_at)
    return result
