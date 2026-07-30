import { UseGuards, UseInterceptors, UploadedFile, Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdateUserDto } from './dto/updateUser.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':username')
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMe(
    @Req() req,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("avatar"))
  uploadAvatar(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me/password")
  changePassword(
    @Req() req,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.id, dto);
  }
}
