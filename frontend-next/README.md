# LogoCá Logísticas — Frontend Next.js 14

Dashboard operacional com Next.js 14 App Router, TypeScript, Tailwind CSS, Bootstrap 5, Recharts, Leaflet placeholder, axios.

## Stack
- Next.js 14.2.5 / React 18.3
- Tailwind CSS 3.4 + Bootstrap 5.3
- Recharts 2.12
- Leaflet 1.9 (placeholder MapView com fallback visual)
- Axios para NestJS (3001) e FastAPI (8000)

## Estrutura
```
app/
  layout.tsx          # Root layout + Sidebar
  page.tsx            # redirect /dashboard
  globals.css         # Tailwind + Bootstrap
  dashboard/
    page.tsx          # KPIs, gráficos linha/barra/pizza
    rotas/page.tsx    # Gestão rotas + mapa
    estoque/page.tsx  # Brahma/Pepsi + alertas mínimo
    caminhoes/page.tsx# Frota + GPS
    rastreamento/page.tsx # WebSocket FastAPI tempo real
    pedidos/page.tsx  # B2C/B2B
components/
  Sidebar, Header, KpiCard, ChartCard, MapView, TruckTable, StockAlert
lib/
  api.ts   # axios instances + WebSocket helper
  utils.ts # finance calc (formatBRL, ocupacao, custo rota)
```

## Rodar local
```bash
npm install
npm run dev # http://localhost:3000
```

Env:
```
NEXT_PUBLIC_NEST_API_URL=http://localhost:3001
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Docker
```bash
docker build -t logoca-frontend-next .
docker run -p 3000:3000 --env-file .env logoca-frontend-next
```

Integra com `docker-compose.yml` na raiz:
- `frontend-next:3000`
- `backend-nest:3001`
- `backend-fastapi:8000`

## Funcionalidades
- KPIs: pedidos, faturamento, ocupação galpão, caminhões em rota
- Gráficos Recharts (linha faturamento 14d, barra performance rota, pizza mix Brahma/Pepsi)
- Tabelas pedidos/frota/estoque com alertas mínimo
- Mapa realtime placeholder com lat/lng + marcação frota (pronto para Leaflet via dynamic import)
- WebSocket `createTrackingSocket` para `ws://fastapi/ws/tracking`
