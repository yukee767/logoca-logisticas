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
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly markupPercent: number;

  constructor(
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    private configService: ConfigService,
  ) {
    this.markupPercent = this.configService.get<number>('business.markupPercent', 20);
  }

  /**
   * Cálculo de preço final: basePrice + markup 20%
   * Ex: base 100 => final 120
   */
  calculateFinalPrice(basePrice: number): number {
    const final = basePrice * (1 + this.markupPercent / 100);
    return Math.round(final * 100) / 100;
  }

  /**
   * Validação quantidade mínima: quantity >= minQuantity
   */
  validateMinQuantity(quantity: number, minQuantity: number): void {
    if (quantity < minQuantity) {
      throw new BadRequestException(
        `Quantidade ${quantity} abaixo do mínimo permitido: ${minQuantity}`,
      );
    }
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<Product>> {
    const [data, total] = await this.productsRepo.findAndCount({
      where: { isActive: true },
      order: { [pagination.sortBy]: pagination.order },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(data, total, pagination.page, pagination.limit);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { sku } });
    if (!product) throw new NotFoundException(`Produto SKU ${sku} não encontrado`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const exists = await this.productsRepo.findOne({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException(`SKU ${dto.sku} já cadastrado`);

    const minQuantity = dto.minQuantity ?? 1;
    if (minQuantity < 1) {
      throw new BadRequestException('Quantidade mínima deve ser >= 1');
    }

    const finalPrice = this.calculateFinalPrice(dto.basePrice);

    const product = this.productsRepo.create({
      ...dto,
      minQuantity,
      finalPrice,
    });

    const saved = await this.productsRepo.save(product);
    this.logger.log(
      `Produto criado: ${saved.name} | base ${saved.basePrice} -> final ${saved.finalPrice} (+${this.markupPercent}%) | minQty ${saved.minQuantity}`,
    );
    return saved;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.sku && dto.sku !== product.sku) {
      const exists = await this.productsRepo.findOne({ where: { sku: dto.sku } });
      if (exists) throw new ConflictException(`SKU ${dto.sku} já cadastrado`);
    }

    if (dto.basePrice !== undefined) {
      (dto as any).finalPrice = this.calculateFinalPrice(dto.basePrice);
    }

    if (dto.minQuantity !== undefined && dto.minQuantity < 1) {
      throw new BadRequestException('Quantidade mínima deve ser >= 1');
    }

    Object.assign(product, dto);
    return this.productsRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    // soft delete lógico
    product.isActive = false;
    await this.productsRepo.save(product);
  }

  async adjustStock(id: string, delta: number): Promise<Product> {
    const product = await this.findOne(id);
    const newStock = product.stock + delta;
    if (newStock < 0) {
      throw new BadRequestException('Estoque insuficiente');
    }
    product.stock = newStock;
    return this.productsRepo.save(product);
  }
}
