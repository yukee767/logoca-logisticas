import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderChannel } from '../entities/order.entity';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'uuid do produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 5, description: 'Quantidade. Validada contra minQuantity do produto' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ enum: OrderChannel, example: OrderChannel.B2C })
  @IsOptional()
  @IsEnum(OrderChannel)
  channel?: OrderChannel;

  @ApiPropertyOptional({ example: 'Rua A, 123 - São Paulo/SP' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({ example: 'uuid do galpão para retirada/armazenagem' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ example: 120, description: 'Distância em km para cálculo frete' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  distanceKm?: number;

  @ApiPropertyOptional({ example: 'Observações do pedido' })
  @IsOptional()
  @IsString()
  notes?: string;

  // B2B usa companyId do usuário autenticado automaticamente
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['pending','confirmed','processing','shipped','delivered','cancelled'] })
  @IsString()
  status: string;
}
