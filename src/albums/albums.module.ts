import { Module } from '@nestjs/common';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { UploadModule } from '@/upload/upload.module';
import { TracksModule } from '@/tracks/tracks.module';

@Module({
  imports: [PrismaModule, UploadModule, TracksModule],
  controllers: [AlbumsController],
  providers: [AlbumsService]
})
export class AlbumsModule {}
