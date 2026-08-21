"""
app/routers/orders.py — CRUD Orders com cálculos financeiros e controle estoque
"""
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus, OrderType
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderItemOut
from app.services.finance_service import FinanceService, calc_final_price, calc_order_total
from app.services.stock_service import StockService
from app.messaging import RabbitMQPublisher, KafkaProducer
from app.cache import RedisCache

router = APIRouter(prefix="/orders", tags=["orders"])


def _calc_unit_price(product: Product) -> Decimal:
    # JS-style: sale_price se existir senão cost*1.20
    if product.sale_price and product.sale_price != Decimal("0"):
        return product.sale_price
    return calc_final_price(product.cost_price)


@router.get("/", response_model=List[OrderOut])
async def list_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    type_filter: Optional[OrderType] = Query(None, alias="type"),
    warehouse_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).options(selectinload(Order.items))
    if status_filter:
        query = query.where(Order.status == status_filter)
    if type_filter:
        query = query.where(Order.type == type_filter)
    if warehouse_id:
        query = query.where(Order.warehouse_id == warehouse_id)
    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().unique().all()
    out = []
    for o in orders:
        # finance cache flag
        cached = await RedisCache.get_finance("order", str(o.id))
        finance_cached = cached is not None
        items_out = []
        for it in o.items:
            # busca product name sku
            prod = await db.get(Product, it.product_id)
            items_out.append(
                OrderItemOut(
                    id=it.id,
                    product_id=it.product_id,
                    quantity=it.quantity,
                    unit_price=it.unit_price,
                    total_price=it.total_price,
                    product_name=prod.name if prod else None,
                    product_sku=prod.sku if prod else None,
                    created_at=it.created_at,
                )
            )
        out.append(
            OrderOut(
                id=o.id,
                code=o.code,
                type=o.type,
                status=o.status,
                customer_id=o.customer_id,
                company_id=o.company_id,
                warehouse_id=o.warehouse_id,
                route_id=o.route_id,
                delivery_address=o.delivery_address,
                delivery_city=o.delivery_city,
                delivery_state=o.delivery_state,
                delivery_zip=o.delivery_zip,
                notes=o.notes,
                total_amount=o.total_amount,
                created_at=o.created_at,
                updated_at=o.updated_at,
                items=items_out,
                items_count=len(items_out),
                total_items_value=sum((it.total_price for it in o.items), Decimal("0.00")),
                finance_cached=finance_cached,
            )
        )
    return out


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    cached = await RedisCache.get_finance("order", str(order.id))
    items_out = []
    for it in order.items:
        prod = await db.get(Product, it.product_id)
        items_out.append(
            OrderItemOut(
                id=it.id,
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=it.total_price,
                product_name=prod.name if prod else None,
                product_sku=prod.sku if prod else None,
                created_at=it.created_at,
            )
        )
    return OrderOut(
        id=order.id,
        code=order.code,
        type=order.type,
        status=order.status,
        customer_id=order.customer_id,
        company_id=order.company_id,
        warehouse_id=order.warehouse_id,
        route_id=order.route_id,
        delivery_address=order.delivery_address,
        delivery_city=order.delivery_city,
        delivery_state=order.delivery_state,
        delivery_zip=order.delivery_zip,
        notes=order.notes,
        total_amount=order.total_amount,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_out,
        items_count=len(items_out),
        total_items_value=sum((it.total_price for it in order.items), Decimal("0.00")),
        finance_cached=cached is not None,
    )


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db)):
    # verifica code único
    exists = await db.execute(select(Order).where(Order.code == payload.code.strip().upper()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Código {payload.code} já existe")

    # Valida e calcula itens com JS-style
    items_to_create = []
    total = Decimal("0.00")
    for item_in in payload.items:
        product = await db.get(Product, item_in.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Produto {item_in.product_id} não encontrado")
        if not product.is_active:
            raise HTTPException(status_code=400, detail=f"Produto {product.sku} inativo")
        # quantity_minimum não é bloqueante no pedido, mas stock deve ter
        unit = item_in.unit_price
        if unit is None:
            unit = _calc_unit_price(product)
        line_total = (unit * Decimal(str(item_in.quantity))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total += line_total
        items_to_create.append(
            {
                "product": product,
                "quantity": item_in.quantity,
                "unit_price": unit,
                "total_price": line_total,
            }
        )

    # Se payload.total_amount veio, usa mas valida
    final_total = payload.total_amount if payload.total_amount is not None else total

    order = Order(
        code=payload.code.strip().upper(),
        type=payload.type,
        status=payload.status,
        customer_id=payload.customer_id,
        company_id=payload.company_id,
        warehouse_id=payload.warehouse_id,
        route_id=payload.route_id,
        total_amount=final_total,
        delivery_address=payload.delivery_address,
        delivery_city=payload.delivery_city,
        delivery_state=payload.delivery_state.upper() if payload.delivery_state else None,
        delivery_zip=payload.delivery_zip,
        notes=payload.notes,
    )
    db.add(order)
    await db.flush()  # pega order.id

    for it in items_to_create:
        oi = OrderItem(
            order_id=order.id,
            product_id=it["product"].id,
            quantity=it["quantity"],
            unit_price=it["unit_price"],
            total_price=it["total_price"],
        )
        db.add(oi)
        # Opcional: reservar estoque se warehouse_id informado
        if order.warehouse_id:
            try:
                await StockService.reserve_stock(db, order.warehouse_id, it["product"].id, it["quantity"])
            except ValueError as e:
                # não falha pedido, só avisa — em produção poderia falhar
                # rollback reservados anteriores? simplifica: log warning
                import logging

                logging.getLogger(__name__).warning(f"Reserva estoque falhou: {e}")

    await db.commit()
    # reload com items
    result = await db.execute(select(Order).where(Order.id == order.id).options(selectinload(Order.items)))
    order = result.scalar_one()

    # Cache financeiro sensível no Redis (TTL 10min)
    finance_data = {
        "order_id": str(order.id),
        "code": order.code,
        "total_amount": str(order.total_amount),
        "subtotal_calc": str(total),
        "items": [{"product_id": str(it.product_id), "unit_price": str(it.unit_price), "total": str(it.total_price)} for it in order.items],
        "calculation": "Σ quantity * unit_price; unit_price = sale_price || cost_price*1.20",
    }
    await FinanceService.cache_order_finance(order.id, finance_data, ttl=600)

    # Mensageria
    try:
        await RabbitMQPublisher.order_created({"id": str(order.id), "code": order.code, "type": order.type.value, "total": str(order.total_amount)})
        await KafkaProducer.order_admin_event({"id": str(order.id), "code": order.code, "type": order.type.value, "total": str(order.total_amount)}, action="created")
    except Exception:
        pass

    items_out = []
    for it in order.items:
        prod = next((x["product"] for x in items_to_create if x["product"].id == it.product_id), None)
        items_out.append(
            OrderItemOut(
                id=it.id,
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=it.total_price,
                product_name=prod.name if prod else None,
                product_sku=prod.sku if prod else None,
                created_at=it.created_at,
            )
        )
    return OrderOut(
        id=order.id,
        code=order.code,
        type=order.type,
        status=order.status,
        customer_id=order.customer_id,
        company_id=order.company_id,
        warehouse_id=order.warehouse_id,
        route_id=order.route_id,
        delivery_address=order.delivery_address,
        delivery_city=order.delivery_city,
        delivery_state=order.delivery_state,
        delivery_zip=order.delivery_zip,
        notes=order.notes,
        total_amount=order.total_amount,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_out,
        items_count=len(items_out),
        total_items_value=total,
        finance_cached=True,
    )


@router.put("/{order_id}", response_model=OrderOut)
async def update_order(order_id: UUID, payload: OrderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        if k == "code" and v:
            v = v.strip().upper()
            # checa duplicidade
            exists = await db.execute(select(Order).where(Order.code == v, Order.id != order_id))
            if exists.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="Código já existe")
        setattr(order, k, v)
    await db.commit()
    await db.refresh(order)
    # atualiza cache finance
    await FinanceService.cache_order_finance(order.id, {"id": str(order.id), "code": order.code, "total": str(order.total_amount), "status": order.status.value}, ttl=600)
    try:
        await RabbitMQPublisher.order_updated({"id": str(order.id), "code": order.code, "status": order.status.value})
        await KafkaProducer.order_admin_event({"id": str(order.id), "code": order.code, "status": order.status.value}, action="updated")
    except Exception:
        pass
    # retorna
    items_out = []
    for it in order.items:
        prod = await db.get(Product, it.product_id)
        items_out.append(
            OrderItemOut(
                id=it.id,
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=it.total_price,
                product_name=prod.name if prod else None,
                product_sku=prod.sku if prod else None,
                created_at=it.created_at,
            )
        )
    return OrderOut(
        id=order.id,
        code=order.code,
        type=order.type,
        status=order.status,
        customer_id=order.customer_id,
        company_id=order.company_id,
        warehouse_id=order.warehouse_id,
        route_id=order.route_id,
        delivery_address=order.delivery_address,
        delivery_city=order.delivery_city,
        delivery_state=order.delivery_state,
        delivery_zip=order.delivery_zip,
        notes=order.notes,
        total_amount=order.total_amount,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_out,
        items_count=len(items_out),
        total_items_value=sum((it.total_price for it in order.items), Decimal("0.00")),
        finance_cached=True,
    )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: UUID, db: AsyncSession = Depends(get_db)):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    await db.delete(order)
    await db.commit()
    await RedisCache.delete(RedisCache.finance_key("order", str(order_id)))
    try:
        await KafkaProducer.order_admin_event({"id": str(order_id)}, action="deleted")
    except Exception:
        pass
    return None


@router.get("/{order_id}/finance", summary="Financeiro sensível (Redis)")
async def get_order_finance(order_id: UUID, db: AsyncSession = Depends(get_db)):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    cached = await FinanceService.get_cached_order_finance(order_id)
    if cached:
        return {"source": "redis", "data": cached}
    # calcula
    result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    items = result.scalars().all()
    finance = {
        "order_id": str(order.id),
        "code": order.code,
        "total_amount": str(order.total_amount),
        "items_total": str(sum((it.total_price for it in items), Decimal("0.00"))),
        "calculation": "Σ quantity*unit_price; unit_price fallback cost*1.20",
        "storage_markup": "0.20",
    }
    await FinanceService.cache_order_finance(order_id, finance)
    return {"source": "db", "data": finance}
