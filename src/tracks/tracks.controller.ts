import { Controller, Post, Get, UseGuards, UseInterceptors, UploadedFile, Body, Req, Param } from '@nestjs/common';
import { TracksService } from './tracks.service';
import { UploadTrackDto } from './dto/UploadTrack.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

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

    @Get('albums/:albumId')
    findAlbumTracks(@Param('albumId') albumId: string) {
        return this.tracksService.findAlbumTracks(albumId);
    }

    @Get(':id')
    GetTrackById(@Param('id') trackId: string) {
        return this.tracksService.GetTrackById(trackId);
    }
}
