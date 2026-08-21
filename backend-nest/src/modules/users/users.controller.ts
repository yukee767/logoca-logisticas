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
import { UsersService } from './users.service';
import { CreateUserDto, CreateCompanyDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateCompanyDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Users
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar usuários (admin)' })
  findAllUsers(@Query() pagination: PaginationDto) {
    return this.usersService.findAllUsers(pagination);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findUserById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar usuário (admin)' })
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar usuário' })
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover usuário' })
  removeUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.removeUser(id);
  }

  // Companies
  @Get('companies/list')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Listar empresas' })
  findAllCompanies(@Query() pagination: PaginationDto) {
    return this.usersService.findAllCompanies(pagination);
  }

  @Post('companies')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar empresa' })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.usersService.createCompany(dto);
  }

  @Get('companies/:id')
  @Roles(UserRole.ADMIN, UserRole.EMPRESA)
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  findCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findCompanyById(id);
  }

  @Patch('companies/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar empresa' })
  updateCompany(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto) {
    return this.usersService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover empresa' })
  removeCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.removeCompany(id);
  }
}
