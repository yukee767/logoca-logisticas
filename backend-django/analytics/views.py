from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.conf import settings

@api_view(['GET'])
@permission_classes([AllowAny])
def kpis(request):
    """KPIs para dashboard Next.js — consome Postgres + Redis cache."""
    with connection.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM orders WHERE type='CONSUMER'")
        total_consumer = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM orders WHERE type='B2B'")
        total_b2b = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM trucks WHERE status='IN_TRANSIT'")
        trucks_in_transit = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM stock s JOIN products p ON s.product_id=p.id WHERE s.quantity < p.minimum_quantity")
        stock_alerts = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status != 'CANCELLED'")
        faturamento = float(cur.fetchone()[0])

    # markup detalhado
    markup = settings.LOGOCA_MARKUP
    return Response({
        "kpis": {
            "pedidos_consumer": total_consumer,
            "pedidos_b2b": total_b2b,
            "caminhoes_em_rota": trucks_in_transit,
            "alertas_estoque": stock_alerts,
            "faturamento_total": faturamento,
            "markup": markup,
            "formula_preco": "sale_price = cost_price * (1 + %.0f%%)" % (markup*100),
        },
        "contact": settings.CONTACT_EMAIL,
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def stock_alerts(request):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT p.sku, p.name, p.brand, p.minimum_quantity, s.quantity, w.code as warehouse
            FROM stock s
            JOIN products p ON s.product_id=p.id
            JOIN warehouses w ON s.warehouse_id=w.id
            WHERE s.quantity < p.minimum_quantity
            ORDER BY (p.minimum_quantity - s.quantity) DESC
        """)
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    return Response({"alerts": rows, "total": len(rows)})
