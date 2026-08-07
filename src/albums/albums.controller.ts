import { Controller, UploadedFile, UseInterceptors, UseGuards, Req, Param, Body, Post, Get, Delete, Patch } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { ReorderAlbumTracksDto } from './dto/reorder-album-tracks.dto';
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

    @Patch('update/:id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor("coverImage"))
    update(
        @Req() req,
        @Param('id') albumId: string,
        @Body() dto: CreateAlbumDto,
        @UploadedFile() coverFile?: Express.Multer.File
    ){
        return this.albumsService.updateAlbum(
            req.user.id,
            albumId,
            dto,
            coverFile
        );
    }

    @Patch('reorder/:id')
    @UseGuards(JwtAuthGuard)
    reorderTracks(
        @Req() req,
        @Param('id') albumId: string,
        @Body() dto: ReorderAlbumTracksDto,
    ) {
        return this.albumsService.reOrderAlbumTracks(
            req.user.id,
            albumId,
            dto.trackIds,
        );
    }

    @Delete('delete/:id')
    @UseGuards(JwtAuthGuard)
    deleteAlbum(@Param('id') albumId: string, @Req() req) {
        return this.albumsService.deleteAlbum(req.user.id, albumId);
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
