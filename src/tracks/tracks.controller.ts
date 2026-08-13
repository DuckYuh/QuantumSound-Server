import { Controller, Post, Get, Delete, UseGuards, UseInterceptors, UploadedFile, Body, Req, Param, Query, Patch } from '@nestjs/common';
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

    @Post('listen/:id')
    @UseGuards(JwtAuthGuard)
    recordListen(
        @Param('id') trackId: string,
        @Req() req,
    ) {
        return this.tracksService.recordListen(
            req.user.id,
            trackId,
        );
    }

    @Get('popular/:id')
    getPopularTracks(
        @Param('id') userId: string
    ) {
        return this.tracksService.getPopularTracks(userId);
    }

    @Post('like/:id')
    @UseGuards(JwtAuthGuard)
    likeTrack(
        @Param('id') trackId: string,
        @Req() req,
    ) {
        return this.tracksService.likeTrack(
            req.user.id,
            trackId,
        );
    }

    @Delete('unlike/:id')
    @UseGuards(JwtAuthGuard)
    unlikeTrack(
        @Param('id') trackId: string,
        @Req() req,
    ) {
        return this.tracksService.unlikeTrack(
            req.user.id,
            trackId,
        );
    }

    @Get('likes/:id')
    @UseGuards(JwtAuthGuard)
    getIsLiked(
        @Param('id') trackId: string,
        @Req() req,
    ) {
        return this.tracksService.getIsLiked(req.user.id, trackId);
    }

    @Get('comments/:id')
    getTrackComments(
        @Param('id') trackId: string,
    ) {
        return this.tracksService.getTrackComments(trackId);
    }

    @Get('comments/count/:id')
    getTrackCommentsCount(
        @Param('id') trackId: string,
    ) {
        return this.tracksService.getTrackCommentsCount(trackId);
    }

    @Get('albums/:albumId')
    findAlbumTracks(@Param('albumId') albumId: string) {
        return this.tracksService.findAlbumTracks(albumId);
    }

    @Get('most-popular')
    getMostPopularTracks(
        @Query('limit') limit?: string,
    ) {
        return this.tracksService.getMostPopularTracks(
            Number(limit) || 50,
        );
    }

    @Get('most-liked')
    getMostLikedTracks(
        @Query('limit') limit?: string,
    ) {
        return this.tracksService.getMostLikedTracks(
            Number(limit) || 50,
        );
    }

    @Get(':id')
    GetTrackById(@Param('id') trackId: string) {
        return this.tracksService.GetTrackById(trackId);
    }
}
