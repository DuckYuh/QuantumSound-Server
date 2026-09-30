import { Module } from '@nestjs/common';

import { AppReleaseController } from './app-release.controller';
import { AppReleaseService } from './app-release.service';

import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    UploadModule,
  ],
  controllers: [AppReleaseController],
  providers: [AppReleaseService],
})
export class AppReleaseModule {}