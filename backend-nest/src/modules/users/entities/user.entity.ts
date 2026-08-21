import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';

export enum UserRoleEnum {
  ADMIN = 'admin',
  EMPRESA = 'empresa',
  CONSUMIDOR = 'consumidor',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 150, unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.CONSUMIDOR })
  role: UserRoleEnum;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
