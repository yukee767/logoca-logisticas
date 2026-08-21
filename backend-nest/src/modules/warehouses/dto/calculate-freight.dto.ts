import { IsOptional, IsNumber, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateFreightDto {
  @ApiPropertyOptional({ description: 'ID do galpão (usa preços do galpão se informado)' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  distanceKm?: number;

  @ApiPropertyOptional({ example: 25.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightKg?: number;
}
