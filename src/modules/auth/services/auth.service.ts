import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { DomainError } from '@/common/domain/error';
import { AuthErrorCodes } from '../errors';

@Injectable()
export class AuthService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    super();
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new DomainError(AuthErrorCodes.USER_NOT_FOUND, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new DomainError(AuthErrorCodes.ACCOUNT_DISABLED, 'Account is disabled');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    
    throw new DomainError(AuthErrorCodes.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new DomainError(AuthErrorCodes.USER_ALREADY_EXISTS, 'User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const newUser = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = newUser;
    return result;
  }
}
