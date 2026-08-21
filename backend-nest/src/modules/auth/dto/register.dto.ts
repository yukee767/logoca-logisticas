import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/decorators/roles.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@logoca.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CONSUMIDOR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'ID da empresa para vincular usuário tipo empresa', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;
}
