import { Module } from '@nestjs/common';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { UploadModule } from '@/upload/upload.module';
import { TagsModule } from '@/tags/tags.module';

@Module({
  imports: [PrismaModule, UploadModule, TagsModule],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}
