"""
app/routers/trucks.py — CRUD Trucks com status disponivel/em_rota/manutencao
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.truck import Truck, TruckStatus, Driver
from app.schemas.truck import TruckCreate, TruckUpdate, TruckOut, DriverOut
from app.messaging import RabbitMQPublisher, KafkaProducer
from app.cache import RedisCache

router = APIRouter(prefix="/trucks", tags=["trucks"])


@router.get("/", response_model=List[TruckOut])
async def list_trucks(
    status_filter: Optional[str] = Query(None, alias="status", description="AVAILABLE, IN_TRANSIT, MAINTENANCE, INACTIVE ou PT-BR disponivel/em_rota/manutencao"),
    marca: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(Truck)
    if status_filter:
        # normaliza PT-BR
        mapping = {
            "disponivel": "AVAILABLE",
            "disponível": "AVAILABLE",
            "em_rota": "IN_TRANSIT",
            "em rota": "IN_TRANSIT",
            "manutencao": "MAINTENANCE",
            "manutenção": "MAINTENANCE",
            "inativo": "INACTIVE",
        }
        lower = status_filter.lower().strip()
        normalized = mapping.get(lower, status_filter.upper())
        try:
            enum_val = TruckStatus(normalized)
            query = query.where(Truck.status == enum_val)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Status inválido: {status_filter}")
    if marca:
        query = query.where(Truck.marca.ilike(f"%{marca}%"))
    query = query.offset(skip).limit(limit).order_by(Truck.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/status/{status_value}", response_model=List[TruckOut])
async def list_by_status_pt(status_value: str, db: AsyncSession = Depends(get_db)):
    mapping = {
        "disponivel": "AVAILABLE",
        "disponível": "AVAILABLE",
        "em_rota": "IN_TRANSIT",
        "em rota": "IN_TRANSIT",
        "em-rota": "IN_TRANSIT",
        "manutencao": "MAINTENANCE",
        "manutenção": "MAINTENANCE",
        "inativo": "INACTIVE",
    }
    normalized = mapping.get(status_value.lower().strip(), status_value.upper())
    try:
        enum_val = TruckStatus(normalized)
    except ValueError:
        raise HTTPException(status_code=400, detail="Status inválido")
    result = await db.execute(select(Truck).where(Truck.status == enum_val))
    return result.scalars().all()


@router.get("/{truck_id}", response_model=TruckOut)
async def get_truck(truck_id: UUID, db: AsyncSession = Depends(get_db)):
    truck = await db.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status_code=404, detail="Caminhão não encontrado")
    return truck


@router.post("/", response_model=TruckOut, status_code=status.HTTP_201_CREATED)
async def create_truck(payload: TruckCreate, db: AsyncSession = Depends(get_db)):
    # placa única
    exists = await db.execute(select(Truck).where(Truck.placa == payload.placa.strip().upper().replace("-", "")))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Placa {payload.placa} já cadastrada")

    truck = Truck(
        placa=payload.placa.strip().upper().replace("-", ""),
        modelo=payload.modelo,
        marca=payload.marca,
        ano=payload.ano,
        capacidade_kg=payload.capacidade_kg,
        capacidade_m3=payload.capacidade_m3,
        status=payload.status,
        current_warehouse_id=payload.current_warehouse_id,
    )
    db.add(truck)
    await db.commit()
    await db.refresh(truck)

    await RedisCache.set(f"truck:{truck.id}", {"placa": truck.placa, "status": truck.status.value}, ttl=600)
    try:
        await KafkaProducer.admin_event("truck.created", {"id": str(truck.id), "placa": truck.placa, "status": truck.status.value})
        await RabbitMQPublisher.publish("truck.created", {"id": str(truck.id), "placa": truck.placa})
    except Exception:
        pass
    return truck


@router.put("/{truck_id}", response_model=TruckOut)
async def update_truck(truck_id: UUID, payload: TruckUpdate, db: AsyncSession = Depends(get_db)):
    truck = await db.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status_code=404, detail="Caminhão não encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "placa" in data and data["placa"]:
        new_placa = data["placa"].strip().upper().replace("-", "")
        if new_placa != truck.placa:
            exists = await db.execute(select(Truck).where(Truck.placa == new_placa, Truck.id != truck_id))
            if exists.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="Placa já existe")
        data["placa"] = new_placa
    for k, v in data.items():
        setattr(truck, k, v)
    await db.commit()
    await db.refresh(truck)
    await RedisCache.set(f"truck:{truck.id}", {"placa": truck.placa, "status": truck.status.value}, ttl=600)
    try:
        await RabbitMQPublisher.publish("truck.updated", {"id": str(truck.id), "placa": truck.placa, "status": truck.status.value})
        await KafkaProducer.admin_event("truck.updated", {"id": str(truck.id), "placa": truck.placa, "status": truck.status.value})
    except Exception:
        pass
    return truck


@router.patch("/{truck_id}/status", response_model=TruckOut, summary="Atualiza apenas status")
async def patch_truck_status(truck_id: UUID, status: str = Query(..., description="disponivel, em_rota, manutencao ou AVAILABLE etc"), db: AsyncSession = Depends(get_db)):
    truck = await db.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status_code=404, detail="Caminhão não encontrado")
    mapping = {
        "disponivel": "AVAILABLE",
        "disponível": "AVAILABLE",
        "em_rota": "IN_TRANSIT",
        "em rota": "IN_TRANSIT",
        "manutencao": "MAINTENANCE",
        "manutenção": "MAINTENANCE",
        "inativo": "INACTIVE",
    }
    normalized = mapping.get(status.lower().strip(), status.upper())
    try:
        enum_val = TruckStatus(normalized)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Status inválido: {status}")
    truck.status = enum_val
    await db.commit()
    await db.refresh(truck)
    return truck


@router.delete("/{truck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_truck(truck_id: UUID, db: AsyncSession = Depends(get_db)):
    truck = await db.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status_code=404, detail="Caminhão não encontrado")
    await db.delete(truck)
    await db.commit()
    await RedisCache.delete(f"truck:{truck_id}")
    return None


# ── Drivers (extra) ──
@router.get("/drivers/list", response_model=List[DriverOut], summary="Lista motoristas")
async def list_drivers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Driver).order_by(Driver.name))
    return result.scalars().all()
