import { Controller, UploadedFile, UseInterceptors, UseGuards, Req, Param, Body, Post, Get } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('albums')
export class AlbumsController {
    constructor(private readonly albumsService: AlbumsService) {}

    @Post('create')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor("coverImage"))
    create(
        @Req() req,
        @Body() dto: CreateAlbumDto,
        @UploadedFile() coverFile?: Express.Multer.File
    ){
        return this.albumsService.create(
            req.user.id,
            dto,
            coverFile
        );
    }

    @Get('users/:username')
    findUserAlbums(@Param('username') username: string) {
        return this.albumsService.findUserAlbums(username);
    }

    @Get(':id')
    getAlbumById(@Param('id') albumId: string) {
        return this.albumsService.getAlbumById(albumId);
    }

    @Get('slug/:slug')
    getAlbumBySlug(@Param('slug') slug: string) {
        return this.albumsService.getAlbumBySlug(slug);
    }
}
