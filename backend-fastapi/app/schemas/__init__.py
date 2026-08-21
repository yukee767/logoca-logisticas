"""
app/schemas/__init__.py
"""
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut  # noqa: F401
from app.schemas.stock import StockCreate, StockUpdate, StockOut, StockAlert  # noqa: F401
from app.schemas.truck import TruckCreate, TruckUpdate, TruckOut, DriverOut  # noqa: F401
from app.schemas.route import RouteCreate, RouteUpdate, RouteOut  # noqa: F401
from app.schemas.order import OrderCreate, OrderOut  # noqa: F401
from app.schemas.tracking import TrackingCreate, TrackingOut  # noqa: F401
