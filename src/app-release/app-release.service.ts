import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { AppPlatform } from '@prisma/client';
import { CreateAppReleaseDto } from './dto/create-app-release.dto';

@Injectable()
export class AppReleaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // =========================
  // PUBLIC
  // =========================

  async findAll() {
    const releases = await this.prisma.appRelease.findMany({
      orderBy: {
        platform: 'asc',
      },
    });

    return releases;
  }

  async findByPlatform(platform: AppPlatform) {
    const release = await this.prisma.appRelease.findUnique({
      where: {
        platform,
      },
    });

    if (!release) {
      throw new NotFoundException(
        `No release found for platform ${platform}`,
      );
    }

    return release;
  }

  // =========================
  // ADMIN
  // =========================

  async upsert(
    platform: AppPlatform,
    dto: CreateAppReleaseDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file');
    }

    // ---------------------------------
    // Validate platform
    // ---------------------------------

    this.validateFile(platform, file);

    // ---------------------------------
    // Find current release
    // ---------------------------------

    const currentRelease = await this.prisma.appRelease.findUnique({
      where: {
        platform,
      },
    });

    // ---------------------------------
    // Upload new file FIRST
    // ---------------------------------
    //
    // Nếu upload thất bại thì DB và file
    // cũ vẫn còn nguyên.
    //

    const uploaded = await this.uploadService.uploadFile(
      file,
      `app-releases/${platform.toLowerCase()}`,
    );

    try {
      // ---------------------------------
      // CREATE
      // ---------------------------------

      if (!currentRelease) {
        return await this.prisma.appRelease.create({
          data: {
            platform,
            version: dto.version,
            fileName: file.originalname,
            fileUrl: uploaded.url,
            r2Key: uploaded.key,
            fileSize: file.size,
            releaseNotes: dto.releaseNotes,
          },
        });
      }

      // ---------------------------------
      // UPDATE
      // ---------------------------------

      const updatedRelease = await this.prisma.appRelease.update({
        where: {
          platform,
        },
        data: {
          version: dto.version,
          fileName: file.originalname,
          fileUrl: uploaded.url,
          r2Key: uploaded.key,
          fileSize: file.size,
          releaseNotes: dto.releaseNotes,
        },
      });

      // ---------------------------------
      // Delete old R2 file
      // ---------------------------------

      try {
        await this.uploadService.deleteFile(currentRelease.fileUrl);
      } catch (error) {
        console.error(
          'Failed to delete old app release file from R2:',
          error,
        );
      }

      return updatedRelease;
    } catch (error) {
      // ---------------------------------
      // DB operation failed
      // ---------------------------------
      //
      // Xóa file mới vì DB chưa trỏ tới nó.
      //

      try {
        await this.uploadService.deleteFile(uploaded.url);
      } catch (deleteError) {
        console.error(
          'Failed to cleanup newly uploaded file:',
          deleteError,
        );
      }

      throw error;
    }
  }

  async remove(platform: AppPlatform) {
    const release = await this.prisma.appRelease.findUnique({
      where: {
        platform,
      },
    });

    if (!release) {
      throw new NotFoundException(
        `No release found for platform ${platform}`,
      );
    }

    // Xóa R2 trước
    await this.uploadService.deleteFile(release.fileUrl);

    // Sau đó xóa DB
    return await this.prisma.appRelease.delete({
      where: {
        platform,
      },
    });
  }

  // =========================
  // VALIDATION
  // =========================

  private validateFile(
    platform: AppPlatform,
    file: Express.Multer.File,
  ) {
    const extension =
      file.originalname.split('.').pop()?.toLowerCase();

    if (platform === AppPlatform.DESKTOP) {
      const allowed = ['exe', 'msi', 'dmg', 'appimage'];

      if (!extension || !allowed.includes(extension)) {
        throw new BadRequestException(
          `Invalid desktop file type. Allowed: ${allowed.join(', ')}`,
        );
      }
    }

    if (platform === AppPlatform.MOBILE) {
      const allowed = ['apk'];

      if (!extension || !allowed.includes(extension)) {
        throw new BadRequestException(
          `Invalid mobile file type. Allowed: ${allowed.join(', ')}`,
        );
      }
    }
  }
}