import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { GenresModule } from './genres/genres.module';
import { AlbumsModule } from './albums/albums.module';
import { TracksModule } from './tracks/tracks.module';
import { SearchModule } from './search/search.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, UploadModule, GenresModule, AlbumsModule, TracksModule, SearchModule, TagsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
