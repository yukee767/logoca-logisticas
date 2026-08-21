import { IsEmail, IsString, IsEnum, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleEnum } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'maria@logoca.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRoleEnum })
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class CreateCompanyDto {
  @ApiProperty({ example: 'Logística Alfa LTDA' })
  @IsString()
  name: string;

  @ApiProperty({ example: '12.345.678/0001-99' })
  @IsString()
  cnpj: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}
