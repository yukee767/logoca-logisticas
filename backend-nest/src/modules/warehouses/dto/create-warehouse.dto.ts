import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsBoolean,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Galpão São Paulo - Zona Leste' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SP-ZL-01' })
  @IsString()
  @Length(2, 20)
  code: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @Length(2, 2)
  state: string;

  @ApiPropertyOptional({ example: 'Av. Radial Leste, 1000' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: -23.55052 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: -46.633308 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ example: 10000, description: 'Capacidade total em posições/pallets' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  capacityTotal: number;

  @ApiPropertyOptional({ example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  baseFreightPrice?: number;

  @ApiPropertyOptional({ example: 1.2 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pricePerKm?: number;

  @ApiPropertyOptional({ example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pricePerKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class UpdateWarehouseDto extends CreateWarehouseDto {}
