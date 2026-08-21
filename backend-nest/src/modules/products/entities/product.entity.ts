import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  finalPrice: number;

  @Column({ type: 'int', default: 1 })
  minQuantity: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight?: number;

  @Column({ length: 50, nullable: true })
  category?: string;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
