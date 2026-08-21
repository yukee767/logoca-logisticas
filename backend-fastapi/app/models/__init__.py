"""
app/models/__init__.py — exporta todos os models
"""
from app.database import Base

# Importar para que Base.metadata conheça todos
from app.models.user import User, Company, Warehouse  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.stock import Stock  # noqa: F401
from app.models.truck import Truck, Driver  # noqa: F401
from app.models.route import Route, RouteStatus  # noqa: F401
from app.models.order import Order, OrderItem, OrderType, OrderStatus  # noqa: F401
from app.models.tracking import TrackingEvent  # noqa: F401

__all__ = [
    "Base",
    "User",
    "Company",
    "Warehouse",
    "Product",
    "Stock",
    "Truck",
    "Driver",
    "Route",
    "RouteStatus",
    "Order",
    "OrderItem",
    "OrderType",
    "OrderStatus",
    "TrackingEvent",
]
