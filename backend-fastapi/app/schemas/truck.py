"""
app/schemas/truck.py
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.truck import TruckStatus


class TruckBase(BaseModel):
    placa: str = Field(..., min_length=7, max_length=10, description="Placa Mercosul ex BRA2E19")
    modelo: str = Field(..., min_length=1, max_length=100)
    marca: Optional[str] = Field(default=None, max_length=100)
    ano: Optional[int] = Field(default=None, ge=1980, le=2030)
    capacidade_kg: Decimal = Field(..., gt=0, description="Capacidade em kg")
    capacidade_m3: Optional[Decimal] = Field(default=None, ge=0)
    status: TruckStatus = Field(default=TruckStatus.AVAILABLE)
    current_warehouse_id: Optional[UUID] = None

    @field_validator("placa")
    @classmethod
    def placa_upper(cls, v: str) -> str:
        v = v.strip().upper().replace("-", "")
        if len(v) not in (7, 8):
            # Mercosul 7 chars, antiga 7-8
            pass
        return v

    @field_validator("status", mode="before")
    @classmethod
    def status_pt(cls, v):
        if isinstance(v, str):
            mapping = {
                "disponivel": "AVAILABLE",
                "disponível": "AVAILABLE",
                "em_rota": "IN_TRANSIT",
                "em rota": "IN_TRANSIT",
                "manutencao": "MAINTENANCE",
                "manutenção": "MAINTENANCE",
                "inativo": "INACTIVE",
            }
            lower = v.lower().strip()
            if lower in mapping:
                return mapping[lower]
            return v.upper()
        return v


class TruckCreate(TruckBase):
    pass


class TruckUpdate(BaseModel):
    placa: Optional[str] = None
    modelo: Optional[str] = None
    marca: Optional[str] = None
    ano: Optional[int] = Field(default=None, ge=1980, le=2030)
    capacidade_kg: Optional[Decimal] = Field(default=None, gt=0)
    capacidade_m3: Optional[Decimal] = None
    status: Optional[TruckStatus] = None
    current_warehouse_id: Optional[UUID] = None

    @field_validator("status", mode="before")
    @classmethod
    def status_pt_upd(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            mapping = {
                "disponivel": "AVAILABLE",
                "disponível": "AVAILABLE",
                "em_rota": "IN_TRANSIT",
                "em rota": "IN_TRANSIT",
                "manutencao": "MAINTENANCE",
                "manutenção": "MAINTENANCE",
                "inativo": "INACTIVE",
            }
            lower = v.lower().strip()
            if lower in mapping:
                return mapping[lower]
            return v.upper()
        return v


class TruckOut(TruckBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DriverOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    name: str
    cpf: Optional[str] = None
    cnh: Optional[str] = None
    cnh_category: Optional[str] = None
    phone: Optional[str] = None
    is_available: bool
    current_truck_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
