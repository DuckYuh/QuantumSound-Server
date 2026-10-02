import { UsersService } from '@/users/users.service';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcrypt';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  private async createAuthResponse(user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    role: string;
  }) {
    const access_token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { refreshToken, sessionId } =
      await this.refreshTokenService.createSession(user.id);

    return {
      access_token,
      refresh_token: refreshToken,
      session_id: sessionId,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    };
  }

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

    return this.createAuthResponse(user);
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

    return this.createAuthResponse(user);
  }

  async refresh(rawRefreshToken: string) {
    const {
      userId,
      refreshToken,
      sessionId,
    } = await this.refreshTokenService.rotateToken(rawRefreshToken);

    const user = await this.usersService.findById(userId);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not available');
    }

    const access_token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token,
      refresh_token: refreshToken,
      session_id: sessionId,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(rawRefreshToken: string): Promise<{ message: string }> {
    await this.refreshTokenService.revokeToken(rawRefreshToken);

    return { message: 'Logged out successfully' };
  }
}
