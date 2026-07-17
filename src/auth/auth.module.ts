import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '@/users/users.service';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';

@Module({
  imports: [JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '7d',
      },
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, PrismaService],
})
export class AuthModule {}
