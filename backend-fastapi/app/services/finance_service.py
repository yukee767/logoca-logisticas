"""
app/services/finance_service.py — Cálculos financeiros JS-style + Redis para dados sensíveis
Preço final = cost_price * 1.20
Margem, total pedido, impostos, frete etc.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List
from uuid import UUID
import json

from app.cache import RedisCache
from app.config import get_settings

settings = get_settings()

MARKUP = Decimal(str(settings.storage_markup))  # 0.20


def calc_final_price(cost_price: Decimal) -> Decimal:
    """JS equivalent: cost_price * 1.20"""
    return (Decimal(cost_price) * (Decimal("1") + MARKUP)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_margin(cost_price: Decimal, final_price: Decimal | None = None) -> Decimal:
    if final_price is None:
        final_price = calc_final_price(cost_price)
    return (final_price - Decimal(cost_price)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_order_total(items: List[Dict[str, Any]]) -> Decimal:
    """Soma total = Σ quantity * unit_price (JS-style toFixed(2))"""
    total = Decimal("0.00")
    for it in items:
        qty = Decimal(str(it.get("quantity", 0)))
        price = Decimal(str(it.get("unit_price", 0)))
        total += qty * price
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_freight(distance_km: Decimal | float | None, weight_kg: Decimal | float | None = None) -> Decimal:
    """Frete simples: R$ 2,50/km + R$ 0,80/kg se informado"""
    if distance_km is None:
        return Decimal("0.00")
    d = Decimal(str(distance_km))
    freight = d * Decimal("2.50")
    if weight_kg is not None:
        freight += Decimal(str(weight_kg)) * Decimal("0.80")
    return freight.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class FinanceService:
    """Service com cache Redis para dados financeiros sensíveis"""

    @staticmethod
    async def get_cached_order_finance(order_id: UUID) -> Dict[str, Any] | None:
        return await RedisCache.get_finance("order", str(order_id))

    @staticmethod
    async def cache_order_finance(order_id: UUID, data: Dict[str, Any], ttl: int = 600) -> None:
        await RedisCache.cache_finance("order", str(order_id), data, ttl=ttl)

    @staticmethod
    async def get_cached_product_finance(product_id: UUID) -> Dict[str, Any] | None:
        return await RedisCache.get_finance("product", str(product_id))

    @staticmethod
    async def cache_product_finance(product_id: UUID, data: Dict[str, Any], ttl: int = 300) -> None:
        await RedisCache.cache_finance("product", str(product_id), data, ttl=ttl)

    @staticmethod
    def enrich_product(product) -> Dict[str, Any]:
        final = calc_final_price(product.cost_price)
        margin = calc_margin(product.cost_price, final)
        return {
            "final_price": str(final),
            "sale_price_effective": str(product.sale_price if product.sale_price and product.sale_price != Decimal("0") else final),
            "margin_value": str(margin),
            "margin_percent": "20.00",
            "storage_markup": str(MARKUP),
        }

    @staticmethod
    def enrich_order(order, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        subtotal = calc_order_total(items)
        # aplica markup armazenamento se pedido contiver Brahma/Pepsi? Exemplo regra
        has_beverage = any((it.get("brand") or "").lower() in ("brahma", "pepsi") for it in items)
        storage_fee = (subtotal * MARKUP).quantize(Decimal("0.01")) if has_beverage else Decimal("0.00")
        total = (subtotal + storage_fee).quantize(Decimal("0.01"))
        return {
            "subtotal": str(subtotal),
            "storage_fee_20pct": str(storage_fee),
            "total_with_storage": str(total),
            "items_count": len(items),
            "has_brahma_pepsi": has_beverage,
        }
