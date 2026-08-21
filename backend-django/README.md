# LogoCá — Backend Django (Analytics/BI)

Microsserviço Django 5 complementar.

- **Função:** BI, relatórios, KPIs para dashboard Next.js. Lê Postgres principal (`managed=False`), cache Redis, consome RabbitMQ e Kafka via Celery.
- **Porta:** `8001` (FastAPI usa 8000, Nest usa 3000)
- **Endpoints:**
  - `GET /health/` — healthcheck
  - `GET /api/analytics/kpis/` — KPIs (pedidos B2C/B2B, faturamento, caminhões em rota, alertas estoque) + fórmula `sale = cost * 1.20`
  - `GET /api/analytics/stock-alerts/` — produtos abaixo de `minimum_quantity` (Brahma/Pepsi inclusos)
  - `/admin/` — Django Admin

Rodar:
```bash
pip install -r requirements.txt
python manage.py migrate --run-syncdb
python manage.py runserver 8001
# Celery
celery -A logoca worker -l info
celery -A logoca beat -l info
```

Contato: logocalogisticas@contato.com
