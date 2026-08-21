-- =============================================================================
-- LogoCá Logísticas — init.sql
-- Schema completo + seeds (Brahma, Pepsi, produtos com quantidade mínima)
-- Postgres 16
-- =============================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'DRIVER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('CONSUMER', 'B2B');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE truck_status AS ENUM ('AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE route_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('ORDER_UPDATE', 'STOCK_ALERT', 'ROUTE_UPDATE', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABELAS
-- ─────────────────────────────────────────────────────────────────────────────

-- Companies (Brahmª, Pepsi etc.)
CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  cnpj            VARCHAR(18) UNIQUE,
  email           VARCHAR(255),
  phone           VARCHAR(30),
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(2),
  zip_code        VARCHAR(10),
  is_supplier     BOOLEAN NOT NULL DEFAULT false,
  is_client       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'CUSTOMER',
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  phone           VARCHAR(30),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(50) UNIQUE NOT NULL,
  address         TEXT NOT NULL,
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(2) NOT NULL,
  zip_code        VARCHAR(10),
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  capacity_m3     DECIMAL(12,2),
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku               VARCHAR(50) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  category          VARCHAR(100),
  brand             VARCHAR(100),
  unit              VARCHAR(20) NOT NULL DEFAULT 'UN', -- UN, CX, KG, L
  cost_price        DECIMAL(12,2) NOT NULL DEFAULT 0,  -- preço de custo
  sale_price        DECIMAL(12,2) NOT NULL DEFAULT 0,  -- preço de venda
  minimum_quantity  INTEGER NOT NULL DEFAULT 10,         -- estoque mínimo
  weight_kg         DECIMAL(10,3),
  volume_m3         DECIMAL(10,4),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  company_id        UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock (estoque por warehouse + product)
CREATE TABLE IF NOT EXISTS stock (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (warehouse_id, product_id)
);

-- Trucks
CREATE TABLE IF NOT EXISTS trucks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa           VARCHAR(10) NOT NULL UNIQUE, -- ex: BRA2E19 (Mercosul)
  modelo          VARCHAR(100) NOT NULL,
  marca           VARCHAR(100),
  ano             INTEGER,
  capacidade_kg   DECIMAL(10,2) NOT NULL,
  capacidade_m3   DECIMAL(10,2),
  status          truck_status NOT NULL DEFAULT 'AVAILABLE',
  current_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  cpf             VARCHAR(14) UNIQUE,
  cnh             VARCHAR(20) UNIQUE,
  cnh_category    VARCHAR(5),
  phone           VARCHAR(30),
  is_available    BOOLEAN NOT NULL DEFAULT true,
  current_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) UNIQUE NOT NULL,
  origem          VARCHAR(255) NOT NULL,
  destino         VARCHAR(255) NOT NULL,
  origem_warehouse_id  UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  destino_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  distance_km     DECIMAL(10,2),
  estimated_hours DECIMAL(6,2),
  status          route_status NOT NULL DEFAULT 'PLANNED',
  truck_id        UUID REFERENCES trucks(id) ON DELETE SET NULL,
  driver_id       UUID REFERENCES drivers(id) ON DELETE SET NULL,
  departure_at    TIMESTAMPTZ,
  arrival_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) UNIQUE NOT NULL,
  type            order_type NOT NULL, -- CONSUMER vs B2B
  status          order_status NOT NULL DEFAULT 'PENDING',
  customer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL, -- B2B: empresa compradora
  warehouse_id    UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  route_id        UUID REFERENCES routes(id) ON DELETE SET NULL,
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  delivery_city   VARCHAR(100),
  delivery_state  VARCHAR(2),
  delivery_zip    VARCHAR(10),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      DECIMAL(12,2) NOT NULL,
  total_price     DECIMAL(12,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracking Events (GPS lat/lng + timestamp)
CREATE TABLE IF NOT EXISTS tracking_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  route_id        UUID REFERENCES routes(id) ON DELETE CASCADE,
  truck_id        UUID REFERENCES trucks(id) ON DELETE SET NULL,
  latitude        DECIMAL(10,8) NOT NULL,
  longitude       DECIMAL(11,8) NOT NULL,
  speed_kmh       DECIMAL(6,2),
  event_type      VARCHAR(50) NOT NULL DEFAULT 'POSITION_UPDATE', -- POSITION_UPDATE, DEPARTURE, ARRIVAL, CHECKPOINT
  description     TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_order ON tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_route ON tracking_events(route_id);
CREATE INDEX IF NOT EXISTS idx_tracking_recorded ON tracking_events(recorded_at);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  type            notification_type NOT NULL DEFAULT 'SYSTEM',
  title           VARCHAR(255) NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated ON companies;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_trucks_updated ON trucks;
CREATE TRIGGER trg_trucks_updated BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_routes_updated ON routes;
CREATE TRIGGER trg_routes_updated BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- SEEDS
-- ─────────────────────────────────────────────────────────────────────────────

-- Companies
INSERT INTO companies (id, name, cnpj, email, phone, city, state, is_supplier, is_client) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ambev - Brahma', '07.526.557/0001-00', 'contato@ambev.com.br', '(11) 99999-0001', 'São Paulo', 'SP', true, false),
  ('22222222-2222-2222-2222-222222222222', 'PepsiCo Brasil', '31.565.104/0001-77', 'contato@pepsico.com.br', '(11) 99999-0002', 'São Paulo', 'SP', true, false),
  ('33333333-3333-3333-3333-333333333333', 'LogoCá Logísticas', '12.345.678/0001-99', 'logocalogisticas@contato.com', '(11) 98888-0000', 'São Paulo', 'SP', false, false),
  ('44444444-4444-4444-4444-444444444444', 'Supermercado Central B2B', '98.765.432/0001-10', 'compras@supercentral.com.br', '(11) 97777-0001', 'Campinas', 'SP', false, true),
  ('55555555-5555-5555-5555-555555555555', 'Distribuidora Paulista', '11.222.333/0001-44', 'contato@distpaulista.com.br', '(11) 96666-0001', 'Santos', 'SP', false, true)
ON CONFLICT (id) DO NOTHING;

-- Users (senhas: bcrypt hash de 'logoca123' — gere novamente em produção)
INSERT INTO users (id, name, email, password_hash, role, company_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin LogoCá', 'admin@logoca.com', crypt('logoca123', gen_salt('bf')), 'ADMIN', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000002', 'Gerente Operações', 'gerente@logoca.com', crypt('logoca123', gen_salt('bf')), 'MANAGER', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000003', 'João Motorista', 'joao.motorista@logoca.com', crypt('logoca123', gen_salt('bf')), 'DRIVER', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000004', 'Cliente Consumidor', 'cliente@exemplo.com', crypt('logoca123', gen_salt('bf')), 'CUSTOMER', NULL),
  ('a0000000-0000-0000-0000-000000000005', 'Comprador B2B Central', 'b2b@supercentral.com.br', crypt('logoca123', gen_salt('bf')), 'CUSTOMER', '44444444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- Warehouses
INSERT INTO warehouses (id, name, code, address, city, state, zip_code, latitude, longitude, capacity_m3, company_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'CD São Paulo - Central', 'CD-SP-01', 'Av. Marginal Tietê, 1000', 'São Paulo', 'SP', '01100-000', -23.550520, -46.633308, 5000.00, '33333333-3333-3333-3333-333333333333'),
  ('b0000000-0000-0000-0000-000000000002', 'CD Campinas', 'CD-CPS-01', 'Rod. Anhanguera, Km 98', 'Campinas', 'SP', '13000-000', -22.909938, -47.062633, 3000.00, '33333333-3333-3333-3333-333333333333'),
  ('b0000000-0000-0000-0000-000000000003', 'CD Santos - Porto', 'CD-STS-01', 'Av. Portuária, 500', 'Santos', 'SP', '11000-000', -23.960833, -46.333611, 2500.00, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Products (Brahma, Pepsi, com minimum_quantity e cost_price)
INSERT INTO products (id, sku, name, description, category, brand, unit, cost_price, sale_price, minimum_quantity, weight_kg, company_id) VALUES
  -- Brahma
  ('c0000000-0000-0000-0000-000000000001', 'BRAHMA-LATA-350', 'Brahma Lata 350ml', 'Cerveja Brahma lata 350ml', 'Bebidas', 'Brahma', 'UN', 1.80, 2.99, 100, 0.37, '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000002', 'BRAHMA-LATAO-473', 'Brahma Latão 473ml', 'Cerveja Brahma latão 473ml', 'Bebidas', 'Brahma', 'UN', 2.20, 3.79, 80, 0.50, '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000003', 'BRAHMA-GARRAFA-600', 'Brahma Garrafa 600ml', 'Cerveja Brahma garrafa retornável 600ml', 'Bebidas', 'Brahma', 'UN', 3.00, 5.49, 50, 0.85, '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000004', 'BRAHMA-CX-12-350', 'Brahma Caixa 12x350ml', 'Caixa Brahma 12 latas 350ml', 'Bebidas', 'Brahma', 'CX', 20.50, 32.90, 20, 4.50, '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000005', 'BRAHMA-DUPLO-MALTE-350', 'Brahma Duplo Malte 350ml', 'Brahma Duplo Malte lata 350ml', 'Bebidas', 'Brahma', 'UN', 2.10, 3.49, 60, 0.37, '11111111-1111-1111-1111-111111111111'),
  -- Pepsi
  ('c0000000-0000-0000-0000-000000000006', 'PEPSI-LATA-350', 'Pepsi Lata 350ml', 'Refrigerante Pepsi lata 350ml', 'Bebidas', 'Pepsi', 'UN', 1.50, 2.79, 120, 0.37, '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000007', 'PEPSI-GARRAFA-2L', 'Pepsi Garrafa 2L', 'Refrigerante Pepsi PET 2 litros', 'Bebidas', 'Pepsi', 'UN', 3.80, 6.99, 60, 2.10, '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000008', 'PEPSI-GARRAFA-1L', 'Pepsi Garrafa 1L', 'Refrigerante Pepsi PET 1 litro', 'Bebidas', 'Pepsi', 'UN', 2.50, 4.49, 80, 1.05, '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000009', 'PEPSI-CX-12-350', 'Pepsi Caixa 12x350ml', 'Caixa Pepsi 12 latas 350ml', 'Bebidas', 'Pepsi', 'CX', 17.00, 28.90, 25, 4.50, '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000010', 'PEPSI-BLACK-350', 'Pepsi Black 350ml', 'Pepsi Black sem açúcar 350ml', 'Bebidas', 'Pepsi', 'UN', 1.60, 2.99, 70, 0.37, '22222222-2222-2222-2222-222222222222'),
  -- Outros / genéricos para teste de estoque mínimo
  ('c0000000-0000-0000-0000-000000000011', 'AGUA-MINERAL-500', 'Água Mineral 500ml', 'Água mineral sem gás 500ml', 'Bebidas', 'LogoCá', 'UN', 0.80, 1.99, 200, 0.52, '33333333-3333-3333-3333-333333333333'),
  ('c0000000-0000-0000-0000-000000000012', 'SUCO-LARANJA-1L', 'Suco Laranja 1L', 'Suco natural laranja 1L', 'Bebidas', 'LogoCá', 'UN', 4.00, 7.50, 40, 1.05, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Stock (distribui estoque nos 3 CDs)
INSERT INTO stock (warehouse_id, product_id, quantity, reserved_quantity) VALUES
  -- CD SP
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 500, 20),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 300, 10),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 600, 30),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 250, 5),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000011', 800, 0),
  -- CD Campinas
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 150, 10),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 400, 15),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000009', 80, 5),
  -- CD Santos
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 60, 5),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000010', 200, 10),
  -- Produto abaixo do mínimo para testar alerta de estoque
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 5, 0),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012', 8, 0)
ON CONFLICT (warehouse_id, product_id) DO NOTHING;

-- Trucks
INSERT INTO trucks (id, placa, modelo, marca, ano, capacidade_kg, capacidade_m3, status, current_warehouse_id) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'BRA2E19', 'FH 540', 'Volvo', 2022, 23000.00, 90.00, 'AVAILABLE', 'b0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'PEX8A32', 'Actros 2651', 'Mercedes-Benz', 2021, 25000.00, 95.00, 'AVAILABLE', 'b0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'LOG1C41', 'T680', 'DAF', 2023, 20000.00, 80.00, 'MAINTENANCE', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Drivers
INSERT INTO drivers (id, user_id, name, cpf, cnh, cnh_category, phone, is_available, current_truck_id) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'João Motorista', '123.456.789-00', '12345678901', 'E', '(11) 98888-1111', true, 'd0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000002', NULL, 'Maria Caminhoneira', '987.654.321-00', '10987654321', 'E', '(11) 98888-2222', true, 'd0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Routes
INSERT INTO routes (id, code, origem, destino, origem_warehouse_id, destino_warehouse_id, distance_km, estimated_hours, status, truck_id, driver_id) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'RTA-SP-CPS-001', 'CD São Paulo - Central', 'CD Campinas', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 98.00, 1.50, 'PLANNED', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000002', 'RTA-SP-STS-001', 'CD São Paulo - Central', 'CD Santos - Porto', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 80.00, 1.80, 'IN_PROGRESS', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Orders (exemplos CONSUMER e B2B)
INSERT INTO orders (id, code, type, status, customer_id, company_id, warehouse_id, route_id, total_amount, delivery_address, delivery_city, delivery_state) VALUES
  ('70000000-0000-0000-0000-000000000001', 'ORD-C-000001', 'CONSUMER', 'CONFIRMED', 'a0000000-0000-0000-0000-000000000004', NULL, 'b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 59.80, 'Rua das Flores, 123', 'São Paulo', 'SP'),
  ('70000000-0000-0000-0000-000000000002', 'ORD-B2B-000001', 'B2B', 'PENDING', 'a0000000-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'b0000000-0000-0000-0000-000000000001', NULL, 3290.00, 'Av. Central, 500', 'Campinas', 'SP')
ON CONFLICT (id) DO NOTHING;

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
  ('70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 10, 2.99, 29.90),
  ('70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 10, 2.79, 27.90),
  ('70000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 50, 32.90, 1645.00),
  ('70000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000009', 50, 28.90, 1445.00)
ON CONFLICT DO NOTHING;

-- Tracking Events
INSERT INTO tracking_events (order_id, route_id, truck_id, latitude, longitude, speed_kmh, event_type, description) VALUES
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', -23.550520, -46.633308, 0, 'DEPARTURE', 'Saída CD São Paulo'),
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', -23.420000, -46.900000, 72.5, 'POSITION_UPDATE', 'Em trânsito SP-Campinas'),
  ('70000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', -23.700000, -46.500000, 65.0, 'POSITION_UPDATE', 'Em trânsito SP-Santos');

-- Notifications
INSERT INTO notifications (user_id, type, title, message, is_read, related_order_id) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'ORDER_UPDATE', 'Pedido confirmado', 'Seu pedido ORD-C-000001 foi confirmado e está em separação.', false, '70000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', 'STOCK_ALERT', 'Estoque abaixo do mínimo', 'Produto Brahma Duplo Malte 350ml (SKU BRAHMA-DUPLO-MALTE-350) abaixo da quantidade mínima (5 < 60) no CD-SP-01.', false, NULL)
ON CONFLICT DO NOTHING;
