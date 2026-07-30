import { Controller, UseGuards, Req, Param, Body, Post, Get } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('albums')
export class AlbumsController {
    constructor(private readonly albumsService: AlbumsService) {}

    @Post('create')
    @UseGuards(JwtAuthGuard)
    create(
        @Req() req,
        @Body() dto: CreateAlbumDto
    ){
        return this.albumsService.create(
            req.user.id,
            dto
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
}
