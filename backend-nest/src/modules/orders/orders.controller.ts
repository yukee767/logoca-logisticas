import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos (consumer vê só seus, empresa vê da company, admin vê tudo)' })
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: any) {
    return this.ordersService.findAll(pagination, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar pedido' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.CONSUMIDOR, UserRole.EMPRESA, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Criar pedido consumer/B2B (RabbitMQ user>empresa, Kafka admin, valida minQuantity, estoque, calcula frete)',
  })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto.status, user);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CONSUMIDOR, UserRole.EMPRESA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar pedido (estorna estoque)' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.ordersService.cancel(id, user);
  }
}
