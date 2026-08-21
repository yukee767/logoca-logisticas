from django.urls import path
from .views import kpis, stock_alerts

urlpatterns = [
    path('analytics/kpis/', kpis, name='analytics-kpis'),
    path('analytics/stock-alerts/', stock_alerts, name='analytics-stock-alerts'),
]
