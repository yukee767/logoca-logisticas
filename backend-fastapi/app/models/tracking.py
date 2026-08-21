"""
app/models/tracking.py — TrackingEvent (GPS lat/lng + timestamp)
"""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Text, DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TrackingEvent(Base):
    __tablename__ = "tracking_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"))
    route_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"))
    truck_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("trucks.id", ondelete="SET NULL"), index=True)
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 8), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(11, 8), nullable=False)
    speed_kmh: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    event_type: Mapped[str] = mapped_column(String(50), default="POSITION_UPDATE", nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
