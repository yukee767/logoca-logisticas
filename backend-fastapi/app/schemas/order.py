"""
app/schemas/order.py
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.order import OrderType, OrderStatus


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)
    unit_price: Optional[Decimal] = Field(default=None, ge=0, description="Se None, usa sale_price/final_price do produto")


class OrderItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    type: OrderType = Field(..., description="CONSUMER vs B2B")
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    customer_id: Optional[UUID] = None
    company_id: Optional[UUID] = None  # B2B usa company_id
    warehouse_id: Optional[UUID] = None
    route_id: Optional[UUID] = None
    delivery_address: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = Field(default=None, max_length=2)
    delivery_zip: Optional[str] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Itens do pedido")
    total_amount: Optional[Decimal] = Field(default=None, description="Se None, calculado via soma items")

    @field_validator("delivery_state")
    @classmethod
    def state_upper(cls, v):
        if v is None:
            return v
        return v.strip().upper()


class OrderUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[OrderType] = None
    status: Optional[OrderStatus] = None
    customer_id: Optional[UUID] = None
    company_id: Optional[UUID] = None
    warehouse_id: Optional[UUID] = None
    route_id: Optional[UUID] = None
    total_amount: Optional[Decimal] = None
    delivery_address: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_zip: Optional[str] = None
    notes: Optional[str] = None
    # items update not included — use dedicated endpoint se precisar


class OrderOut(OrderBase):
    id: UUID
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []
    items_count: int = 0
    total_items_value: Decimal = Decimal("0.00")
    # financeiro — marcado como sensível (Redis cached)
    finance_cached: bool = False

    model_config = {"from_attributes": True}
