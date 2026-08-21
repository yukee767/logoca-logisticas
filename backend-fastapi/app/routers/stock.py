"""
app/routers/stock.py — CRUD estoque com alerta mínimo + Brahma/Pepsi filter
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.stock import Stock
from app.models.product import Product
from app.models.user import Warehouse
from app.schemas.stock import StockCreate, StockUpdate, StockOut
from app.services.stock_service import StockService
from app.cache import RedisCache

router = APIRouter(prefix="/stock", tags=["stock"])


async def _enrich_stock(db: AsyncSession, stock: Stock) -> dict:
    # busca product e warehouse
    product = await db.get(Product, stock.product_id)
    warehouse = await db.get(Warehouse, stock.warehouse_id)
    is_below = False
    minimum = None
    product_name = None
    product_sku = None
    product_brand = None
    if product:
        minimum = product.minimum_quantity
        is_below = stock.quantity < product.minimum_quantity
        product_name = product.name
        product_sku = product.sku
        product_brand = product.brand
    alert_msg = None
    if is_below:
        alert_msg = f"Alerta: {product_name} ({product_sku}) abaixo do mínimo {minimum} — atual {stock.quantity}"
    return {
        "id": stock.id,
        "warehouse_id": stock.warehouse_id,
        "product_id": stock.product_id,
        "quantity": stock.quantity,
        "reserved_quantity": stock.reserved_quantity,
        "updated_at": stock.updated_at,
        "available_quantity": stock.quantity - stock.reserved_quantity,
        "is_below_minimum": is_below,
        "minimum_quantity": minimum,
        "product_name": product_name,
        "product_sku": product_sku,
        "product_brand": product_brand,
        "warehouse_code": warehouse.code if warehouse else None,
        "alert_message": alert_msg,
    }


@router.get("/", response_model=List[StockOut])
async def list_stock(
    warehouse_id: Optional[UUID] = None,
    product_id: Optional[UUID] = None,
    brand: Optional[str] = Query(None, description="Filtra por brand Brahma/Pepsi"),
    below_minimum: Optional[bool] = Query(None, description="Se true, só traz abaixo do mínimo"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(Stock)
    if warehouse_id:
        query = query.where(Stock.warehouse_id == warehouse_id)
    if product_id:
        query = query.where(Stock.product_id == product_id)
    query = query.offset(skip).limit(limit).order_by(Stock.updated_at.desc())
    result = await db.execute(query)
    stocks = result.scalars().all()

    enriched = []
    for s in stocks:
        e = await _enrich_stock(db, s)
        # brand filter
        if brand and (e["product_brand"] or "").lower() != brand.lower():
            continue
        if below_minimum is True and not e["is_below_minimum"]:
            continue
        if below_minimum is False and e["is_below_minimum"]:
            continue
        enriched.append(e)
    return enriched


@router.get("/alerts", response_model=List[dict], summary="Estoques abaixo do mínimo")
async def get_alerts(
    warehouse_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    alerts = await StockService.list_alerts(db, warehouse_id)
    return alerts


@router.get("/alerts/brahma-pepsi", summary="Alertas só Brahma/Pepsi")
async def get_alerts_brahma_pepsi(
    warehouse_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    alerts = await StockService.list_alerts(db, warehouse_id)
    return [a for a in alerts if (a.get("product_brand") or "").lower() in ("brahma", "pepsi")]


@router.get("/{stock_id}", response_model=StockOut)
async def get_stock(stock_id: UUID, db: AsyncSession = Depends(get_db)):
    stock = await db.get(Stock, stock_id)
    if not stock:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")
    return await _enrich_stock(db, stock)


@router.post("/", response_model=StockOut, status_code=status.HTTP_201_CREATED)
async def create_stock(payload: StockCreate, db: AsyncSession = Depends(get_db)):
    # verifica product e warehouse existem
    product = await db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    warehouse = await db.get(Warehouse, payload.warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse não encontrado")

    # upsert: se já existe warehouse+product, atualiza quantity
    existing = await db.execute(select(Stock).where(Stock.warehouse_id == payload.warehouse_id, Stock.product_id == payload.product_id))
    stock = existing.scalar_one_or_none()
    if stock:
        raise HTTPException(status_code=409, detail="Estoque já existe para este warehouse+product — use PUT")

    stock = Stock(
        warehouse_id=payload.warehouse_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        reserved_quantity=payload.reserved_quantity,
    )
    db.add(stock)
    await db.commit()
    await db.refresh(stock)

    # checa alerta
    await StockService.check_stock_alert(db, stock)

    # cache Redis
    await RedisCache.set(f"stock:{stock.id}", {"quantity": stock.quantity}, ttl=600)

    return await _enrich_stock(db, stock)


@router.put("/{stock_id}", response_model=StockOut)
async def update_stock(stock_id: UUID, payload: StockUpdate, db: AsyncSession = Depends(get_db)):
    stock = await db.get(Stock, stock_id)
    if not stock:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(stock, k, v)
    # validação: quantity >= reserved?
    # Não precisa, mas alerta se quantity < minimum
    await db.commit()
    await db.refresh(stock)
    await StockService.check_stock_alert(db, stock)
    return await _enrich_stock(db, stock)


@router.post("/{stock_id}/reserve", response_model=StockOut, summary="Reserva estoque (reserved_quantity)")
async def reserve_stock(stock_id: UUID, quantity: int = Query(..., gt=0), db: AsyncSession = Depends(get_db)):
    stock = await db.get(Stock, stock_id)
    if not stock:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")
    try:
        stock = await StockService.reserve_stock(db, stock.warehouse_id, stock.product_id, quantity)
        await db.commit()
        await db.refresh(stock)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return await _enrich_stock(db, stock)


@router.post("/{stock_id}/consume", response_model=StockOut, summary="Consome estoque")
async def consume_stock(stock_id: UUID, quantity: int = Query(..., gt=0), db: AsyncSession = Depends(get_db)):
    stock = await db.get(Stock, stock_id)
    if not stock:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")
    try:
        stock = await StockService.consume_stock(db, stock.warehouse_id, stock.product_id, quantity)
        await db.commit()
        await db.refresh(stock)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return await _enrich_stock(db, stock)


@router.delete("/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stock(stock_id: UUID, db: AsyncSession = Depends(get_db)):
    stock = await db.get(Stock, stock_id)
    if not stock:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")
    await db.delete(stock)
    await db.commit()
    return None
