# LogoCá Logísticas — Frontend Angular 17

Stack: Angular 17 standalone + TypeScript + Tailwind CSS + Bootstrap 5 + Angular Router + RxJS + Chart.js

## Rodar local
```bash
npm install
npm start # http://localhost:4200
```

## Build
```bash
npm run build
```

## Docker
```bash
docker build -t logoca-frontend .
docker run -p 80:80 logoca-frontend
```

## Estrutura
- `src/app/core/services` — auth, api (mock produtos Brahma/Pepsi + cálculo frete), cart
- `src/app/core/interceptors` — auth, error
- `src/app/shared/components` — header, footer, card-produto, layout
- `src/app/features` — home, catalog, product-detail, cart, checkout, para-empresas, sobre, contato
- `src/environments` — environment.ts

## Páginas
- `/` Home institucional (hero, serviços, parceiros Brahma/Pepsi, gráficos Chart.js)
- `/catalogo` Catálogo e-commerce B2C/B2B (grid, filtro, qtd mínima, custo+20%)
- `/produto/:id` Detalhe (galpão, calcular frete)
- `/carrinho` e `/checkout`
- `/para-empresas` Coleta no galpão, transporte, armazenagem + CTA logocalogisticas@contato.com
- `/sobre` e `/contato`

Design: azul marinho #0f2140, laranja #ff6b00, branco, responsivo.

Contato: logocalogisticas@contato.com
