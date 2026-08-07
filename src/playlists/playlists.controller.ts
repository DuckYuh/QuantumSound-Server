import { Controller, UploadedFile, UseInterceptors, UseGuards, Get, Post, Delete, Patch, Body, Req } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/CreatePlaylists.dto';
import { AddTrackDto } from './dto/AddTrackDto.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { UpdatePlaylistDto } from './dto/UpdatePlaylist.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('playlists')
export class PlaylistsController {
    constructor(private readonly playlistsService: PlaylistsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createPlaylist(@Req() req, @Body() dto: CreatePlaylistDto) {
        return this.playlistsService.createPlaylist(
            req.user.id, 
            dto
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('add-track')
    async addTrackToPlaylist(@Req() req, @Body() dto: AddTrackDto) {
        return this.playlistsService.addTrackToPlaylist(
            req.user.id, 
            dto
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update/:id')
    @UseInterceptors(FileInterceptor("coverImage"))
    async updatePlaylist(
        @Req() req,
        @Body() dto: UpdatePlaylistDto,
        @UploadedFile() coverFile?: Express.Multer.File
    ) {
        return this.playlistsService.updatePlaylist(
            req.user.id,
            req.params.id,
            dto,
            coverFile
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete/:id')
    async deletePlaylist(@Req() req) {
        return this.playlistsService.deletePlaylist(
            req.user.id,
            req.params.id
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete('remove-track/:trackId')
    async removeTrackFromPlaylist(@Req() req, @Body() body) {
        return this.playlistsService.removeTrackFromPlaylist(
            req.user.id,
            body.playlistId,
            req.params.trackId
        );
    }

    @Get('all')
    async getAllPlaylists() {
        return this.playlistsService.GetAll();
    }

    @Get(':id')
    async getPlaylist(@Req() req) {
        return this.playlistsService.getPlaylistById(req.params.id);
    }

    @Get('user/:username')
    async getUserPlaylists(@Req() req) {
        return this.playlistsService.getUserPlaylists(req.params.username);
    }
}
