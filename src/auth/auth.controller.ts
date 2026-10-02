import { Body, Controller, UseGuards, Req, UnauthorizedException, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh') 
  refresh(@Body('refresh_token') refreshToken: string) { 
    if (!refreshToken || typeof refreshToken !== 'string') 
      { 
        throw new UnauthorizedException('Refresh token is required'); 
      } 
    return this.auth.refresh(refreshToken); 
  }

  @Post('logout')
  logout(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    return this.auth.logout(refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req) {
      return req.user;
  }
}
