import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus, OrderChannel } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { RabbitMQService } from '../../messaging/rabbitmq.service';
import { KafkaService } from '../../messaging/kafka.service';
import { WarehousesService } from '../warehouses/warehouses.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    private configService: ConfigService,
    private rabbitMQService: RabbitMQService,
    private kafkaService: KafkaService,
    private warehousesService: WarehousesService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    user: { id: string; role: string; companyId?: string },
  ): Promise<PaginatedResponse<Order>> {
    const where: any = {};
    // consumidor vê só seus pedidos, empresa vê da sua company, admin vê tudo
    if (user.role === 'consumidor') {
      where.userId = user.id;
    } else if (user.role === 'empresa' && user.companyId) {
      where.companyId = user.companyId;
    }

    const [data, total] = await this.ordersRepo.findAndCount({
      where,
      order: { [pagination.sortBy]: pagination.order },
      skip: pagination.skip,
      take: pagination.limit,
      relations: ['items'],
    });
    return new PaginatedResponse(data, total, pagination.page, pagination.limit);
  }

  async findOne(
    id: string,
    user: { id: string; role: string; companyId?: string },
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    // RBAC check
    if (user.role === 'consumidor' && order.userId !== user.id) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (user.role === 'empresa' && order.companyId !== user.companyId) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async create(
    dto: CreateOrderDto,
    user: { id: string; role: string; companyId?: string; email: string },
  ): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Pedido deve conter ao menos um item');
    }

    // Determina channel e companyId pelas regras de negócio
    // consumer = B2C, empresa = B2B vinculado à sua empresa
    let channel = dto.channel || OrderChannel.B2C;
    let companyId: string | null = null;

    if (user.role === 'empresa') {
      channel = OrderChannel.B2B;
      companyId = user.companyId || null;
      if (!companyId) {
        throw new BadRequestException('Usuário empresa sem companyId vinculado');
      }
    } else if (user.role === 'consumidor') {
      channel = OrderChannel.B2C;
    } else if (user.role === 'admin') {
      channel = dto.channel || OrderChannel.B2B;
    }

    // Validar e montar itens com preço final (+20%) e minQuantity
    const orderItems: Partial<OrderItem>[] = [];
    let subtotal = 0;
    let totalWeight = 0;

    for (const item of dto.items) {
      const product = await this.productsRepo.findOne({ where: { id: item.productId } });
      if (!product || !product.isActive) {
        throw new NotFoundException(`Produto ${item.productId} não encontrado ou inativo`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para ${product.name} (SKU ${product.sku}): disponível ${product.stock}, solicitado ${item.quantity}`,
        );
      }
      // validação quantidade mínima
      if (item.quantity < product.minQuantity) {
        throw new BadRequestException(
          `Quantidade ${item.quantity} para ${product.name} abaixo do mínimo ${product.minQuantity}`,
        );
      }

      const unitPrice = Number(product.finalPrice);
      const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal += totalPrice;
      if (product.weight) {
        totalWeight += Number(product.weight) * item.quantity;
      }

      orderItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });

      // Decrementa estoque (em transação real usar queryRunner)
      product.stock -= item.quantity;
      await this.productsRepo.save(product);
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Cálculo frete via WarehousesService se warehouse/distance informados
    let freight = 0;
    if (dto.warehouseId || dto.distanceKm !== undefined || totalWeight > 0) {
      freight = await this.warehousesService.calculateFreight({
        warehouseId: dto.warehouseId,
        distanceKm: dto.distanceKm || 0,
        weightKg: totalWeight,
      });
    }

    const total = Math.round((subtotal + freight) * 100) / 100;

    const order = this.ordersRepo.create({
      userId: user.id,
      companyId,
      channel,
      status: OrderStatus.PENDING,
      subtotal,
      freight,
      total,
      totalWeight: Math.round(totalWeight * 100) / 100,
      distanceKm: dto.distanceKm,
      warehouseId: dto.warehouseId,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      items: orderItems as OrderItem[],
    });

    const saved = await this.ordersRepo.save(order);
    this.logger.log(
      `Pedido criado ${saved.id} | user ${user.email} [${channel}] | total R$ ${saved.total} (subtotal ${subtotal} + frete ${freight}) | ${orderItems.length} itens`,
    );

    // Integração assíncrona RabbitMQ user -> empresa (fila de pedidos)
    // Payload contém pedido + contexto para empresas consumirem
    try {
      await this.rabbitMQService.publishOrder({
        event: 'order.created',
        orderId: saved.id,
        channel,
        userId: user.id,
        companyId,
        total: saved.total,
        items: orderItems,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`RabbitMQ publish ok order ${saved.id}`);
    } catch (e) {
      this.logger.error(`Falha RabbitMQ order ${saved.id}: ${e.message}`);
      // não falha o pedido, apenas loga - DLQ tratará reprocessamento se necessário
    }

    // Kafka event para admin / analytics
    try {
      await this.kafkaService.emit(
        this.configService.get<string>('kafka.topicOrders', 'logoca.orders'),
        {
          event: 'order.created',
          orderId: saved.id,
          channel,
          status: saved.status,
          total: saved.total,
          userId: user.id,
          companyId,
        },
      );
    } catch (e) {
      this.logger.warn(`Falha Kafka emit order ${saved.id}: ${e.message}`);
    }

    return saved;
  }

  async updateStatus(
    id: string,
    status: string,
    user: { id: string; role: string },
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException(`Status inválido: ${status}`);
    }

    order.status = status as OrderStatus;
    const saved = await this.ordersRepo.save(order);

    // Notifica via Kafka e RabbitMQ
    try {
      await this.kafkaService.emit(
        this.configService.get<string>('kafka.topicOrders', 'logoca.orders'),
        { event: 'order.status_changed', orderId: id, status, userId: user.id },
      );
      await this.rabbitMQService.publishOrder({
        event: 'order.status_changed',
        orderId: id,
        status,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      this.logger.warn(`Falha ao publicar status_changed ${id}: ${e.message}`);
    }

    return saved;
  }

  async cancel(
    id: string,
    user: { id: string; role: string; companyId?: string },
  ): Promise<Order> {
    const order = await this.findOne(id, user);
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)) {
      throw new BadRequestException(`Não é possível cancelar pedido em status ${order.status}`);
    }
    order.status = OrderStatus.CANCELLED;
    const saved = await this.ordersRepo.save(order);

    // estorna estoque
    for (const item of order.items) {
      const product = await this.productsRepo.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock += item.quantity;
        await this.productsRepo.save(product);
      }
    }

    return saved;
  }
}
