"""
app/models/stock.py — Stock (warehouse_id + product_id)
"""
import uuid
from datetime import datetime

from sqlalchemy import Integer, DateTime, ForeignKey, func, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Stock(Base):
    __tablename__ = "stock"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "product_id", name="uq_stock_warehouse_product"),
        CheckConstraint("quantity >= 0", name="ck_stock_quantity_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="ck_stock_reserved_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reserved_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships opcionais (evita import circular hard)
    # warehouse: Mapped["Warehouse"] = relationship("Warehouse")
    # product: Mapped["Product"] = relationship("Product")

    @property
    def available_quantity(self) -> int:
        return max(0, self.quantity - self.reserved_quantity)

    @property
    def is_low(self) -> bool:
        # será checado no service comparando com product.minimum_quantity
        return False  # placeholder
