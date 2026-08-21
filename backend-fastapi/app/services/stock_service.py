"""
app/services/stock_service.py — Controle de estoque Brahma/Pepsi + alerta mínimo
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.models.stock import Stock
from app.messaging import RabbitMQPublisher, KafkaProducer
from app.cache import RedisCache
import logging

logger = logging.getLogger(__name__)


class StockService:
    @staticmethod
    async def check_stock_alert(db: AsyncSession, stock: Stock) -> Dict[str, Any] | None:
        """Verifica se quantity < minimum_quantity e dispara alerta"""
        product = await db.get(Product, stock.product_id)
        if not product:
            return None
        is_below = stock.quantity < product.minimum_quantity
        if not is_below:
            return None

        alert = {
            "stock_id": str(stock.id),
            "product_id": str(product.id),
            "product_sku": product.sku,
            "product_name": product.name,
            "product_brand": product.brand,
            "warehouse_id": str(stock.warehouse_id),
            "quantity": stock.quantity,
            "minimum_quantity": product.minimum_quantity,
            "available_quantity": stock.quantity - stock.reserved_quantity,
            "is_brahma_pepsi": (product.brand or "").lower() in ("brahma", "pepsi"),
            "message": f"Estoque abaixo do mínimo: {product.name} ({product.sku}) — {stock.quantity} < {product.minimum_quantity} no warehouse {stock.warehouse_id}",
        }

        # Publica nos dois brokers
        try:
            await RabbitMQPublisher.stock_alert(alert)
        except Exception as e:
            logger.warning(f"Rabbit stock alert falhou: {e}")

        try:
            await KafkaProducer.stock_admin_event(alert)
        except Exception as e:
            logger.warning(f"Kafka stock alert falhou: {e}")

        # Cache no Redis para dashboard
        await RedisCache.set(f"stock:alert:{stock.id}", alert, ttl=3600)

        return alert

    @staticmethod
    async def list_alerts(db: AsyncSession, warehouse_id: Optional[UUID] = None) -> List[Dict[str, Any]]:
        """Lista estoques abaixo do mínimo"""
        query = select(Stock, Product).join(Product, Stock.product_id == Product.id)
        if warehouse_id:
            query = query.where(Stock.warehouse_id == warehouse_id)
        result = await db.execute(query)
        alerts = []
        for stock, product in result.all():
            if stock.quantity < product.minimum_quantity:
                alerts.append(
                    {
                        "stock_id": str(stock.id),
                        "warehouse_id": str(stock.warehouse_id),
                        "product_id": str(product.id),
                        "product_sku": product.sku,
                        "product_name": product.name,
                        "product_brand": product.brand,
                        "quantity": stock.quantity,
                        "reserved_quantity": stock.reserved_quantity,
                        "available_quantity": stock.quantity - stock.reserved_quantity,
                        "minimum_quantity": product.minimum_quantity,
                        "is_brahma_pepsi": (product.brand or "").lower() in ("brahma", "pepsi"),
                        "deficit": product.minimum_quantity - stock.quantity,
                    }
                )
        return alerts

    @staticmethod
    async def reserve_stock(db: AsyncSession, warehouse_id: UUID, product_id: UUID, quantity: int) -> Stock:
        """Reserva estoque (incrementa reserved_quantity) com validação"""
        result = await db.execute(
            select(Stock).where(Stock.warehouse_id == warehouse_id, Stock.product_id == product_id)
        )
        stock = result.scalar_one_or_none()
        if not stock:
            raise ValueError("Estoque não encontrado para warehouse/product")
        if stock.quantity - stock.reserved_quantity < quantity:
            raise ValueError(f"Estoque insuficiente. Disponível: {stock.quantity - stock.reserved_quantity}, solicitado: {quantity}")
        stock.reserved_quantity += quantity
        await db.flush()
        return stock

    @staticmethod
    async def consume_stock(db: AsyncSession, warehouse_id: UUID, product_id: UUID, quantity: int) -> Stock:
        """Consome estoque (decrementa quantity e reserved_quantity)"""
        result = await db.execute(
            select(Stock).where(Stock.warehouse_id == warehouse_id, Stock.product_id == product_id)
        )
        stock = result.scalar_one_or_none()
        if not stock:
            raise ValueError("Estoque não encontrado")
        if stock.quantity < quantity:
            raise ValueError("Estoque insuficiente para consumo")
        stock.quantity -= quantity
        stock.reserved_quantity = max(0, stock.reserved_quantity - quantity)
        await db.flush()
        # checa alerta após consumo
        await StockService.check_stock_alert(db, stock)
        return stock

    @staticmethod
    def is_brahma_pepsi_filter(brand: str | None) -> bool:
        return (brand or "").lower() in ("brahma", "pepsi")
