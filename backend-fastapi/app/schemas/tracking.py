"""
app/schemas/tracking.py
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class TrackingCreate(BaseModel):
    order_id: Optional[UUID] = None
    route_id: Optional[UUID] = None
    truck_id: Optional[UUID] = Field(default=None, description="Se None, usa truck_id da URL")
    latitude: Decimal = Field(..., ge=Decimal("-90"), le=Decimal("90"))
    longitude: Decimal = Field(..., ge=Decimal("-180"), le=Decimal("180"))
    speed_kmh: Optional[Decimal] = Field(default=None, ge=0, le=Decimal("300"))
    event_type: str = Field(default="POSITION_UPDATE", max_length=50)
    description: Optional[str] = None
    recorded_at: Optional[datetime] = None

    @field_validator("event_type")
    @classmethod
    def normalize_event(cls, v: str) -> str:
        return v.strip().upper()


class TrackingOut(BaseModel):
    id: UUID
    order_id: Optional[UUID] = None
    route_id: Optional[UUID] = None
    truck_id: Optional[UUID] = None
    latitude: Decimal
    longitude: Decimal
    speed_kmh: Optional[Decimal] = None
    event_type: str
    description: Optional[str] = None
    recorded_at: datetime
    created_at: datetime
    # enriquecido
    delay_seconds: Optional[int] = None

    model_config = {"from_attributes": True}


class TrackingWSMessage(BaseModel):
    """Payload WebSocket"""
    truck_id: UUID
    latitude: Decimal
    longitude: Decimal
    speed_kmh: Optional[Decimal] = None
    event_type: str = "POSITION_UPDATE"
    order_id: Optional[UUID] = None
    route_id: Optional[UUID] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
