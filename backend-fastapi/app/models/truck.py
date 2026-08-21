"""
app/models/truck.py — Truck + Driver
"""
import uuid
import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, Boolean, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TruckStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"  # disponivel
    IN_TRANSIT = "IN_TRANSIT"  # em_rota
    MAINTENANCE = "MAINTENANCE"  # manutencao
    INACTIVE = "INACTIVE"

    # Aliases PT-BR para compatibilidade com spec
    @classmethod
    def from_pt(cls, value: str) -> "TruckStatus":
        mapping = {
            "disponivel": cls.AVAILABLE,
            "disponível": cls.AVAILABLE,
            "em_rota": cls.IN_TRANSIT,
            "em rota": cls.IN_TRANSIT,
            "manutencao": cls.MAINTENANCE,
            "manutenção": cls.MAINTENANCE,
            "inativo": cls.INACTIVE,
        }
        lower = value.lower().strip()
        return mapping.get(lower, cls(lower.upper())) if lower in mapping else cls(value.upper())


class Truck(Base):
    __tablename__ = "trucks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    placa: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)  # ex BRA2E19
    modelo: Mapped[str] = mapped_column(String(100), nullable=False)
    marca: Mapped[str | None] = mapped_column(String(100))
    ano: Mapped[int | None] = mapped_column(Integer)
    capacidade_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    capacidade_m3: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    status: Mapped[TruckStatus] = mapped_column(SAEnum(TruckStatus, name="truck_status", create_type=False), default=TruckStatus.AVAILABLE, nullable=False)
    current_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cpf: Mapped[str | None] = mapped_column(String(14), unique=True)
    cnh: Mapped[str | None] = mapped_column(String(20), unique=True)
    cnh_category: Mapped[str | None] = mapped_column(String(5))
    phone: Mapped[str | None] = mapped_column(String(30))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    current_truck_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("trucks.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
