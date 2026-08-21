import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgcrypto for uuid
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'empresa', 'consumidor')
    `);
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "cnpj" varchar(20) NOT NULL,
        "address" varchar(255),
        "city" varchar(100),
        "state" varchar(2),
        "email" varchar(150),
        "phone" varchar(20),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_companies_cnpj" UNIQUE ("cnpj"),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "email" varchar(150) NOT NULL,
        "password" varchar NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'consumidor',
        "phone" varchar,
        "isActive" boolean NOT NULL DEFAULT true,
        "companyId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "description" text,
        "sku" varchar(100) NOT NULL,
        "basePrice" numeric(12,2) NOT NULL,
        "finalPrice" numeric(12,2) NOT NULL,
        "minQuantity" integer NOT NULL DEFAULT 1,
        "stock" integer NOT NULL DEFAULT 0,
        "weight" numeric(8,2),
        "category" varchar(50),
        "companyId" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."orders_status_enum" AS ENUM('pending','confirmed','processing','shipped','delivered','cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."orders_channel_enum" AS ENUM('consumer','b2b')
    `);
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "companyId" uuid,
        "channel" "public"."orders_channel_enum" NOT NULL DEFAULT 'consumer',
        "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending',
        "subtotal" numeric(12,2) NOT NULL DEFAULT 0,
        "freight" numeric(12,2) NOT NULL DEFAULT 0,
        "total" numeric(12,2) NOT NULL DEFAULT 0,
        "totalWeight" numeric(8,2),
        "distanceKm" integer,
        "warehouseId" uuid,
        "shippingAddress" text,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productName" varchar(200) NOT NULL,
        "sku" varchar(100) NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(12,2) NOT NULL,
        "totalPrice" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "warehouses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "code" varchar(20) NOT NULL,
        "city" varchar(150) NOT NULL,
        "state" varchar(2) NOT NULL,
        "address" varchar(255),
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "capacityTotal" integer NOT NULL DEFAULT 0,
        "capacityUsed" integer NOT NULL DEFAULT 0,
        "baseFreightPrice" numeric(12,2) NOT NULL DEFAULT 15.0,
        "pricePerKm" numeric(8,2) NOT NULL DEFAULT 1.2,
        "pricePerKg" numeric(8,2) NOT NULL DEFAULT 0.8,
        "isActive" boolean NOT NULL DEFAULT true,
        "companyId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_warehouses_code" UNIQUE ("code"),
        CONSTRAINT "PK_warehouses" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "warehouses"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_channel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
