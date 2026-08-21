"""
app/schemas/stock.py
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class StockBase(BaseModel):
    warehouse_id: UUID
    product_id: UUID
    quantity: int = Field(..., ge=0, description="Quantidade em estoque")
    reserved_quantity: int = Field(default=0, ge=0)


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    quantity: Optional[int] = Field(default=None, ge=0)
    reserved_quantity: Optional[int] = Field(default=None, ge=0)


class StockOut(StockBase):
    id: UUID
    updated_at: datetime
    available_quantity: int = Field(description="quantity - reserved_quantity")
    is_below_minimum: bool = False
    minimum_quantity: Optional[int] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    product_brand: Optional[str] = None
    warehouse_code: Optional[str] = None
    alert_message: Optional[str] = None

    model_config = {"from_attributes": True}


class StockAlert(BaseModel):
    stock_id: UUID
    product_id: UUID
    product_sku: str
    product_name: str
    product_brand: Optional[str]
    warehouse_id: UUID
    quantity: int
    minimum_quantity: int
    is_below_minimum: bool = True
    message: str
