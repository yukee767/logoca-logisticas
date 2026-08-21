import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/create-warehouse.dto';
import { CalculateFreightDto } from './dto/calculate-freight.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(
    @InjectRepository(Warehouse)
    private warehousesRepo: Repository<Warehouse>,
    private configService: ConfigService,
  ) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<Warehouse>> {
    const [data, total] = await this.warehousesRepo.findAndCount({
      where: { isActive: true },
      order: { [pagination.sortBy]: pagination.order },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(data, total, pagination.page, pagination.limit);
  }

  async findOne(id: string): Promise<Warehouse> {
    const wh = await this.warehousesRepo.findOne({ where: { id } });
    if (!wh) throw new NotFoundException('Galpão não encontrado');
    return wh;
  }

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const exists = await this.warehousesRepo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`Código ${dto.code} já cadastrado`);
    const wh = this.warehousesRepo.create({
      ...dto,
      baseFreightPrice: dto.baseFreightPrice ?? this.configService.get<number>('business.freightBasePrice', 15),
      pricePerKm: dto.pricePerKm ?? this.configService.get<number>('business.freightPerKm', 1.2),
      pricePerKg: dto.pricePerKg ?? this.configService.get<number>('business.freightPerKg', 0.8),
    });
    return this.warehousesRepo.save(wh);
  }

  async update(id: string, dto: Partial<CreateWarehouseDto>): Promise<Warehouse> {
    const wh = await this.findOne(id);
    if (dto.code && dto.code !== wh.code) {
      const exists = await this.warehousesRepo.findOne({ where: { code: dto.code } });
      if (exists) throw new ConflictException(`Código ${dto.code} já cadastrado`);
    }
    Object.assign(wh, dto);
    return this.warehousesRepo.save(wh);
  }

  async remove(id: string): Promise<void> {
    const wh = await this.findOne(id);
    wh.isActive = false;
    await this.warehousesRepo.save(wh);
  }

  /**
   * Cálculo de frete:
   * freight = base + (distanceKm * pricePerKm) + (weightKg * pricePerKg)
   * Se warehouseId informado, usa preços do galpão; senão usa defaults do config.
   */
  async calculateFreight(dto: CalculateFreightDto): Promise<number> {
    let base = this.configService.get<number>('business.freightBasePrice', 15);
    let perKm = this.configService.get<number>('business.freightPerKm', 1.2);
    let perKg = this.configService.get<number>('business.freightPerKg', 0.8);

    if (dto.warehouseId) {
      const wh = await this.warehousesRepo.findOne({ where: { id: dto.warehouseId } });
      if (!wh) throw new NotFoundException(`Galpão ${dto.warehouseId} não encontrado`);
      base = Number(wh.baseFreightPrice);
      perKm = Number(wh.pricePerKm);
      perKg = Number(wh.pricePerKg);
    }

    const distanceKm = dto.distanceKm || 0;
    const weightKg = dto.weightKg || 0;

    const freight = base + distanceKm * perKm + weightKg * perKg;
    const rounded = Math.round(freight * 100) / 100;
    this.logger.debug(`Frete calculado: base ${base} + ${distanceKm}*${perKm} + ${weightKg}*${perKg} = ${rounded}`);
    return rounded;
  }

  /**
   * Armazenagem: aloca capacidade no galpão
   */
  async allocateStorage(warehouseId: string, quantity: number): Promise<Warehouse> {
    const wh = await this.findOne(warehouseId);
    if (wh.capacityUsed + quantity > wh.capacityTotal) {
      throw new BadRequestException(
        `Capacidade insuficiente no galpão ${wh.code}: disponível ${wh.availableCapacity}, solicitado ${quantity}`,
      );
    }
    wh.capacityUsed += quantity;
    return this.warehousesRepo.save(wh);
  }

  async releaseStorage(warehouseId: string, quantity: number): Promise<Warehouse> {
    const wh = await this.findOne(warehouseId);
    wh.capacityUsed = Math.max(0, wh.capacityUsed - quantity);
    return this.warehousesRepo.save(wh);
  }
}
