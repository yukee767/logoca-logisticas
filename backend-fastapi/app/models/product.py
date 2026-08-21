"""
app/models/product.py — Product
"""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Text, Boolean, Numeric, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100))
    brand: Mapped[str | None] = mapped_column(String(100), index=True)  # Brahma, Pepsi, LogoCá
    unit: Mapped[str] = mapped_column(String(20), default="UN", nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    sale_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    minimum_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 3))
    volume_m3: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    company_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship (opcional)
    # stock_entries: Mapped[list["Stock"]] = relationship("Stock", back_populates="product")

    @property
    def final_price(self) -> Decimal:
        """Preço final = cost_price * 1.20 (20% armazenamento) — JS-style calc"""
        return (self.cost_price * Decimal("1.20")).quantize(Decimal("0.01"))

    @property
    def is_brahma_or_pepsi(self) -> bool:
        return (self.brand or "").lower() in ("brahma", "pepsi")
