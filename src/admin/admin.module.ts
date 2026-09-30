import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersService } from '@/users/users.service';
import { UploadService } from '@/upload/upload.service';
import { AlbumsService } from '@/albums/albums.service';
import { TracksService } from '@/tracks/tracks.service';
import { GenresService } from '@/genres/genres.service';
import { TagsService } from '@/tags/tags.service';
import { AppReleaseService } from '@/app-release/app-release.service';

@Module({
    providers: [UsersService, UploadService, AlbumsService, TracksService, GenresService, TagsService, AppReleaseService],
    controllers: [AdminController],
})
export class AdminModule {}