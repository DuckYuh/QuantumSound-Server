import { Controller, Post, Get, Delete, UseGuards, UseInterceptors, UploadedFile, Body, Req, Param, Patch } from '@nestjs/common';
import { TracksService } from './tracks.service';
import { UploadTrackDto } from './dto/UploadTrack.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateTrackDto } from './dto/UpdateTrack.dto';

@Controller('tracks')
export class TracksController {
    constructor(private readonly tracksService: TracksService) {}

    @Post("upload")
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor("audio"))
    upload(
        @UploadedFile() file:Express.Multer.File,
        @Body() dto:UploadTrackDto,
        @Req() req
    ){
        return this.tracksService.upload(
            req.user.id,
            file,
            dto
        );
    }

    @Delete('delete/:id')
    @UseGuards(JwtAuthGuard)
    deleteTrack(@Param('id') trackId: string, @Req() req) {
        return this.tracksService.deleteTrack(req.user.id, trackId);
    }

    @Patch('update/:id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor("coverImage"))
    updateTrack(
        @Param('id') trackId: string,
        @Body() dto: UpdateTrackDto,
        @UploadedFile() coverFile: Express.Multer.File,
        @Req() req
    ) {
        return this.tracksService.updateTrack(req.user.id, trackId, dto, coverFile);
    }

    @Get('albums/:albumId')
    findAlbumTracks(@Param('albumId') albumId: string) {
        return this.tracksService.findAlbumTracks(albumId);
    }

    @Get(':id')
    GetTrackById(@Param('id') trackId: string) {
        return this.tracksService.GetTrackById(trackId);
    }
}
