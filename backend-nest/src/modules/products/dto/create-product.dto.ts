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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Caixa de Papelão G' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ example: 'Caixa reforçada para logística' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'SKU-001-G' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 100.0, description: 'Preço base. Final será +20% markup' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  basePrice: number;

  @ApiPropertyOptional({ example: 1, description: 'Quantidade mínima por pedido' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ example: 2.5, description: 'Peso em kg para cálculo de frete' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ example: 'embalagens' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Empresa dona do produto' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
