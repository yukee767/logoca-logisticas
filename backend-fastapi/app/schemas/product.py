"""
app/schemas/product.py — Pydantic schemas com validação JS-style financeira
"""
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, computed_field


def calc_final_price(cost_price: Decimal) -> Decimal:
    """JS-style: cost_price * 1.20 — usa Decimal para precisão financeira"""
    return (cost_price * Decimal("1.20")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50, description="SKU único ex: BRAHMA-LATA-350")
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default="Bebidas", max_length=100)
    brand: Optional[str] = Field(default=None, max_length=100, description="Brahma, Pepsi, LogoCá")
    unit: str = Field(default="UN", pattern="^(UN|CX|KG|L|ML)$")
    cost_price: Decimal = Field(..., ge=0, decimal_places=2, description="Preço de custo")
    sale_price: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2, description="Se não informado, será cost_price*1.20")
    minimum_quantity: int = Field(default=10, ge=0, description="Estoque mínimo — alerta se abaixo")
    weight_kg: Optional[Decimal] = Field(default=None, ge=0)
    volume_m3: Optional[Decimal] = Field(default=None, ge=0)
    is_active: bool = True
    company_id: Optional[UUID] = None

    @field_validator("minimum_quantity")
    @classmethod
    def validate_minimum(cls, v: int) -> int:
        if v < 0:
            raise ValueError("quantity_minimum deve ser >= 0")
        return v

    @field_validator("sku")
    @classmethod
    def sku_upper(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("brand")
    @classmethod
    def brand_normalize(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(default=None, min_length=3, max_length=50)
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = Field(default=None, pattern="^(UN|CX|KG|L|ML)$")
    cost_price: Optional[Decimal] = Field(default=None, ge=0)
    sale_price: Optional[Decimal] = Field(default=None, ge=0)
    minimum_quantity: Optional[int] = Field(default=None, ge=0)
    weight_kg: Optional[Decimal] = None
    volume_m3: Optional[Decimal] = None
    is_active: Optional[bool] = None
    company_id: Optional[UUID] = None


class ProductOut(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    # Preço final calculado 20% armazenamento — sempre presente
    final_price: Decimal = Field(description="cost_price * 1.20")
    margin_value: Decimal = Field(description="final_price - cost_price")
    is_brahma_pepsi: bool = Field(description="True se brand Brahma ou Pepsi")
    stock_alert: bool = Field(default=False, description="Será preenchido via join com stock")

    model_config = {"from_attributes": True}

    @field_validator("final_price", mode="before")
    @classmethod
    def _coerce_final(cls, v):
        return v

    @staticmethod
    def from_orm_with_calc(obj, stock_quantity: Optional[int] = None) -> dict:
        # helper para construir dict com calc
        data = {
            "id": obj.id,
            "sku": obj.sku,
            "name": obj.name,
            "description": obj.description,
            "category": obj.category,
            "brand": obj.brand,
            "unit": obj.unit,
            "cost_price": obj.cost_price,
            "sale_price": obj.sale_price if obj.sale_price and obj.sale_price != Decimal("0") else calc_final_price(obj.cost_price),
            "minimum_quantity": obj.minimum_quantity,
            "weight_kg": obj.weight_kg,
            "volume_m3": obj.volume_m3,
            "is_active": obj.is_active,
            "company_id": obj.company_id,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "final_price": calc_final_price(obj.cost_price),
            "margin_value": (calc_final_price(obj.cost_price) - obj.cost_price).quantize(Decimal("0.01")),
            "is_brahma_pepsi": (obj.brand or "").lower() in ("brahma", "pepsi"),
            "stock_alert": (stock_quantity is not None and stock_quantity < obj.minimum_quantity),
        }
        return data
