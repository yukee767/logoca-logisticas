import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Index()
  @Column({ length: 150 })
  city: string;

  @Column({ length: 2 })
  state: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Column({ type: 'int', default: 0 })
  capacityTotal: number;

  @Column({ type: 'int', default: 0 })
  capacityUsed: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 15.0 })
  baseFreightPrice: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 1.2 })
  pricePerKm: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0.8 })
  pricePerKg: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get availableCapacity(): number {
    return this.capacityTotal - this.capacityUsed;
  }

  get occupancyRate(): number {
    if (this.capacityTotal === 0) return 0;
    return Math.round((this.capacityUsed / this.capacityTotal) * 10000) / 100;
  }
}
