import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: dto.role as any,
      companyId: dto.companyId || null,
      phone: dto.phone,
    });

    await this.usersRepository.save(user);
    this.logger.log(`Novo usuário registrado: ${user.email} [${user.role}]`);

    const tokens = this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = this.generateTokens(user);
    this.logger.log(`Login: ${user.email}`);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuário inválido');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  private sanitizeUser(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }
}
