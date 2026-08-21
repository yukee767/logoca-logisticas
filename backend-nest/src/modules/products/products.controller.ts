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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar produtos (público ou autenticado)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.productsService.findAll(pagination);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Detalhar produto. Exibe preço final já com +20%' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Criar produto (cálculo automático +20% markup, validação minQuantity)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Atualizar produto (recalcula finalPrice se basePrice mudar)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Desativar produto (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
