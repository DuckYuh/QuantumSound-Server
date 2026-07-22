import { UsersService } from '@/users/users.service';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existed = await this.usersService.findByEmail(dto.email);

    if (existed) {
      throw new BadRequestException('Email already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createUser({
      username: dto.username,
      displayName: dto.displayName,
      email: dto.email,
      password: hashed,
    });

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matched = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!matched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async me(access_token: string) {
    const payload = this.jwt.verify(access_token);
    return this.usersService.findByEmail(payload.email);
  }
}
