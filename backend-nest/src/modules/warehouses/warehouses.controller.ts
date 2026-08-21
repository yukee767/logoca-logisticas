import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/create-warehouse.dto';
import { CalculateFreightDto } from './dto/calculate-freight.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';

@ApiTags('Warehouses')
@ApiBearerAuth('JWT-auth')
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar galpões (paginação + ocupação)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.warehousesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar galpão' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Criar galpão (empresa/admin)' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Atualizar galpão' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar galpão' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.remove(id);
  }

  @Post('freight/calculate')
  @ApiOperation({ summary: 'Calcular frete: base + km*pricePerKm + kg*pricePerKg (usa galpão se informado)' })
  calculateFreight(@Body() dto: CalculateFreightDto) {
    return this.warehousesService.calculateFreight(dto).then((freight) => ({ freight }));
  }

  @Post(':id/allocate')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Alocar armazenagem no galpão (valida capacidade)' })
  allocate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.warehousesService.allocateStorage(id, quantity);
  }

  @Post(':id/release')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Liberar armazenagem no galpão' })
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.warehousesService.releaseStorage(id, quantity);
  }
}
