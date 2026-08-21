"""
app/models/route.py — Route
"""
import uuid
import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, DateTime, ForeignKey, Numeric, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RouteStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    origem: Mapped[str] = mapped_column(String(255), nullable=False)
    destino: Mapped[str] = mapped_column(String(255), nullable=False)
    origem_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="SET NULL"))
    destino_warehouse_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="SET NULL"))
    distance_km: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    estimated_hours: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    status: Mapped[RouteStatus] = mapped_column(SAEnum(RouteStatus, name="route_status", create_type=False), default=RouteStatus.PLANNED, nullable=False)
    truck_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("trucks.id", ondelete="SET NULL"))
    driver_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="SET NULL"))
    departure_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    arrival_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    @property
    def eta(self) -> datetime | None:
        """ETA calculado via departure_at + estimated_hours"""
        if self.departure_at and self.estimated_hours:
            from datetime import timedelta
            return self.departure_at + timedelta(hours=float(self.estimated_hours))
        return self.arrival_at
