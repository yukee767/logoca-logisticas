import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Company } from './entities/company.entity';
import { CreateUserDto, CreateCompanyDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateCompanyDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Company)
    private companiesRepo: Repository<Company>,
  ) {}

  // --- Users ---
  async findAllUsers(pagination: PaginationDto): Promise<PaginatedResponse<User>> {
    const [data, total] = await this.usersRepo.findAndCount({
      relations: ['company'],
      order: { [pagination.sortBy]: pagination.order },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(data, total, pagination.page, pagination.limit);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id }, relations: ['company'] });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password: hashed });
    return this.usersRepo.save(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async removeUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    await this.usersRepo.remove(user);
  }

  // --- Companies ---
  async findAllCompanies(pagination: PaginationDto): Promise<PaginatedResponse<Company>> {
    const [data, total] = await this.companiesRepo.findAndCount({
      order: { [pagination.sortBy]: pagination.order },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(data, total, pagination.page, pagination.limit);
  }

  async findCompanyById(id: string): Promise<Company> {
    const company = await this.companiesRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }

  async createCompany(dto: CreateCompanyDto): Promise<Company> {
    const exists = await this.companiesRepo.findOne({ where: { cnpj: dto.cnpj } });
    if (exists) throw new ConflictException('CNPJ já cadastrado');
    const company = this.companiesRepo.create(dto);
    return this.companiesRepo.save(company);
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findCompanyById(id);
    Object.assign(company, dto);
    return this.companiesRepo.save(company);
  }

  async removeCompany(id: string): Promise<void> {
    const company = await this.findCompanyById(id);
    await this.companiesRepo.remove(company);
  }
}
