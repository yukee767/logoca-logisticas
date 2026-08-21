"""
app/schemas/route.py
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, computed_field

from app.models.route import RouteStatus


class RouteBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50, description="Código rota ex RTA-SP-CPS-001")
    origem: str = Field(..., min_length=3, max_length=255)
    destino: str = Field(..., min_length=3, max_length=255)
    origem_warehouse_id: Optional[UUID] = None
    destino_warehouse_id: Optional[UUID] = None
    distance_km: Optional[Decimal] = Field(default=None, ge=0)
    estimated_hours: Optional[Decimal] = Field(default=None, ge=0)
    status: RouteStatus = Field(default=RouteStatus.PLANNED)
    truck_id: Optional[UUID] = None
    driver_id: Optional[UUID] = None
    departure_at: Optional[datetime] = None
    arrival_at: Optional[datetime] = None


class RouteCreate(RouteBase):
    pass


class RouteUpdate(BaseModel):
    code: Optional[str] = None
    origem: Optional[str] = None
    destino: Optional[str] = None
    origem_warehouse_id: Optional[UUID] = None
    destino_warehouse_id: Optional[UUID] = None
    distance_km: Optional[Decimal] = Field(default=None, ge=0)
    estimated_hours: Optional[Decimal] = Field(default=None, ge=0)
    status: Optional[RouteStatus] = None
    truck_id: Optional[UUID] = None
    driver_id: Optional[UUID] = None
    departure_at: Optional[datetime] = None
    arrival_at: Optional[datetime] = None


class RouteOut(RouteBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    eta: Optional[datetime] = Field(default=None, description="ETA = departure_at + estimated_hours")
    duration_minutes: Optional[int] = None
    is_delayed: bool = False

    model_config = {"from_attributes": True}

    @staticmethod
    def enrich(obj) -> dict:
        # Calcula ETA JS-style
        eta = None
        duration = None
        if obj.departure_at and obj.estimated_hours:
            eta = obj.departure_at + timedelta(hours=float(obj.estimated_hours))
            duration = int(float(obj.estimated_hours) * 60)
        elif obj.estimated_hours:
            duration = int(float(obj.estimated_hours) * 60)
        is_delayed = False
        if eta and obj.arrival_at and obj.arrival_at > eta:
            is_delayed = True
        return {
            "id": obj.id,
            "code": obj.code,
            "origem": obj.origem,
            "destino": obj.destino,
            "origem_warehouse_id": obj.origem_warehouse_id,
            "destino_warehouse_id": obj.destino_warehouse_id,
            "distance_km": obj.distance_km,
            "estimated_hours": obj.estimated_hours,
            "status": obj.status,
            "truck_id": obj.truck_id,
            "driver_id": obj.driver_id,
            "departure_at": obj.departure_at,
            "arrival_at": obj.arrival_at,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "eta": eta or obj.arrival_at,
            "duration_minutes": duration,
            "is_delayed": is_delayed,
        }
