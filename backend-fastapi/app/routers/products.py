"""
app/routers/products.py — CRUD completo com validações financeiras
- quantity_minimum validation
- preço final = cost_price *1.20
- controle Brahma/Pepsi
- cache Redis para dados sensíveis
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, calc_final_price
from app.services.finance_service import FinanceService, calc_final_price as finance_calc
from app.cache import RedisCache
from app.messaging import KafkaProducer, RabbitMQPublisher

router = APIRouter(prefix="/products", tags=["products"])


def _to_out(product: Product) -> dict:
    final = finance_calc(product.cost_price)
    sale = product.sale_price if product.sale_price and product.sale_price != Decimal("0") else final
    margin = (final - product.cost_price).quantize(Decimal("0.01"))
    return {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "brand": product.brand,
        "unit": product.unit,
        "cost_price": product.cost_price,
        "sale_price": sale,
        "minimum_quantity": product.minimum_quantity,
        "weight_kg": product.weight_kg,
        "volume_m3": product.volume_m3,
        "is_active": product.is_active,
        "company_id": product.company_id,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "final_price": final,
        "margin_value": margin,
        "is_brahma_pepsi": (product.brand or "").lower() in ("brahma", "pepsi"),
        "stock_alert": False,
    }


@router.get("/", response_model=List[ProductOut])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    brand: Optional[str] = Query(None, description="Filtra por brand: Brahma, Pepsi"),
    is_active: Optional[bool] = None,
    search: Optional[str] = Query(None, description="Busca por sku/nome"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product)
    if brand:
        query = query.where(Product.brand.ilike(f"%{brand}%"))
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    if search:
        like = f"%{search}%"
        query = query.where(or_(Product.sku.ilike(like), Product.name.ilike(like), Product.brand.ilike(like)))
    query = query.offset(skip).limit(limit).order_by(Product.created_at.desc())
    result = await db.execute(query)
    products = result.scalars().all()
    return [_to_out(p) for p in products]


@router.get("/brahma-pepsi", response_model=List[ProductOut], summary="Lista apenas Brahma/Pepsi")
async def list_brahma_pepsi(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.brand.ilike("brahma")).order_by(Product.name))
    brahma = result.scalars().all()
    result2 = await db.execute(select(Product).where(Product.brand.ilike("pepsi")).order_by(Product.name))
    pepsi = result2.scalars().all()
    all_bp = list(brahma) + list(pepsi)
    return [_to_out(p) for p in all_bp]


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    # tenta cache financeiro sensível
    cached = await FinanceService.get_cached_product_finance(product_id)
    out = _to_out(product)
    if cached:
        # mescla mas não expõe custo direto se quiser? Aqui mantém.
        pass
    # cachea financeiro
    await FinanceService.cache_product_finance(product_id, {"cost_price": str(product.cost_price), "final_price": str(out["final_price"])})
    return out


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    # Validação sku único
    existing = await db.execute(select(Product).where(Product.sku == payload.sku.strip().upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"SKU {payload.sku} já existe")

    # Validação quantity_minimum
    if payload.minimum_quantity < 0:
        raise HTTPException(status_code=400, detail="minimum_quantity deve ser >= 0")

    # Cálculo JS-style: se sale_price não informado, usa cost*1.20
    sale = payload.sale_price
    if sale is None or sale == Decimal("0"):
        sale = calc_final_price(payload.cost_price)

    product = Product(
        sku=payload.sku.strip().upper(),
        name=payload.name,
        description=payload.description,
        category=payload.category,
        brand=payload.brand,
        unit=payload.unit,
        cost_price=payload.cost_price,
        sale_price=sale,
        minimum_quantity=payload.minimum_quantity,
        weight_kg=payload.weight_kg,
        volume_m3=payload.volume_m3,
        is_active=payload.is_active,
        company_id=payload.company_id,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    # Cache financeiro Redis (sensível)
    out = _to_out(product)
    await FinanceService.cache_product_finance(product.id, out)
    await RedisCache.set(f"product:{product.id}", out, ttl=300)

    # Eventos
    try:
        await RabbitMQPublisher.publish("product.created", out)
        await KafkaProducer.admin_event("product.created", out)
    except Exception:
        pass

    return out


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: UUID, payload: ProductUpdate, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    data = payload.model_dump(exclude_unset=True)

    # SKU uniqueness
    if "sku" in data and data["sku"]:
        data["sku"] = data["sku"].strip().upper()
        if data["sku"] != product.sku:
            exists = await db.execute(select(Product).where(Product.sku == data["sku"], Product.id != product_id))
            if exists.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="SKU já existe")

    # Se cost_price mudou e sale_price não foi enviado, recalcula 20%
    if "cost_price" in data and data["cost_price"] is not None:
        if "sale_price" not in data or data["sale_price"] is None:
            # só recalcula se não veio sale_price explícito
            data["sale_price"] = calc_final_price(Decimal(str(data["cost_price"])))

    for k, v in data.items():
        if k == "status":
            continue
        setattr(product, k, v)

    await db.commit()
    await db.refresh(product)

    out = _to_out(product)
    await FinanceService.cache_product_finance(product.id, out)
    await RedisCache.set(f"product:{product.id}", out, ttl=300)
    try:
        await RabbitMQPublisher.publish("product.updated", out)
        await KafkaProducer.admin_event("product.updated", out)
    except Exception:
        pass
    return out


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    await db.delete(product)
    await db.commit()
    await RedisCache.delete(f"product:{product_id}")
    await RedisCache.delete(RedisCache.finance_key("product", str(product_id)))
    try:
        await KafkaProducer.admin_event("product.deleted", {"id": str(product_id), "sku": product.sku})
    except Exception:
        pass
    return None


@router.get("/{product_id}/finance", summary="Dados financeiros sensíveis (Redis cache)")
async def get_product_finance(product_id: UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    cached = await FinanceService.get_cached_product_finance(product_id)
    if cached:
        return {"source": "redis", "data": cached}
    out = _to_out(product)
    finance = {
        "cost_price": str(product.cost_price),
        "sale_price": str(out["sale_price"]),
        "final_price": str(out["final_price"]),
        "margin_value": str(out["margin_value"]),
        "margin_percent": "20.00",
        "storage_markup": "0.20",
        "calculation": "cost_price * 1.20 (JS-style)",
    }
    await FinanceService.cache_product_finance(product_id, finance)
    return {"source": "db", "data": finance}
