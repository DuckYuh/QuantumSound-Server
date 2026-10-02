import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '@/users/users.module';
import { PrismaService } from '@/prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ 
      defaultStrategy: 'jwt' 
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService, RefreshTokenService],
  exports: [PassportModule, JwtModule, RefreshTokenService],
})
export class AuthModule {}
