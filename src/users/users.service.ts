import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { Prisma } from '@prisma/client';
import { UploadService } from '@/upload/upload.service';
import bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private uploadService: UploadService,) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findPublicByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatar: true,
        bio: true,
        country: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUser(id: string, data: UpdateUserDto) {
    try {
      return this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          bio: true,
          country: true,
          role: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Username or email already exists");
      }

      throw error;
    }
  }

  async getUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatar: true,
        bio: true,
        country: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user?.avatar) {
      await this.uploadService.deleteFile(user.avatar);
    }
    const uploaded = await this.uploadService.uploadFile(file, 'avatars');
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: uploaded.url },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatar: true,
        bio: true,
        country: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async changePassword (userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async createUser(data: { username: string; displayName: string; email: string; password: string }) {
    return this.prisma.user.create({
      data,
    });
  }
}
