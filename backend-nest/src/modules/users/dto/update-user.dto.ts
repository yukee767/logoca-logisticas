import { PartialType } from '@nestjs/swagger';
import { CreateUserDto, CreateCompanyDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
