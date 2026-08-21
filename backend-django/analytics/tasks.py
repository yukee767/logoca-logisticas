"""
Celery tasks — consome RabbitMQ e checa estoque mínimo.
"""
try:
    from celery import shared_task
    HAS_CELERY = True
except ImportError:
    HAS_CELERY = False
    def shared_task(*a, **kw):
        def deco(fn): return fn
        return deco

@shared_task
def check_stock_alerts():
    from django.db import connection
    with connection.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM stock s JOIN products p ON s.product_id=p.id WHERE s.quantity < p.minimum_quantity")
        count = cur.fetchone()[0]
    print(f"[Analytics] Stock alerts: {count} produtos abaixo do mínimo")
    return count
