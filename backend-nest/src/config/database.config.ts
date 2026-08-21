import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Company } from '../modules/users/entities/company.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { Warehouse } from '../modules/warehouses/entities/warehouse.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
  entities: [User, Company, Product, Order, OrderItem, Warehouse],
  synchronize: configService.get<boolean>('database.synchronize'),
  logging: configService.get<boolean>('database.logging'),
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: false,
  autoLoadEntities: true,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
  },
});
