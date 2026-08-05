import { Controller, UseGuards, Get, Post, Body, Req } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/CreatePlaylists.dto';
import { AddTrackDto } from './dto/AddTrackDto.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

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
