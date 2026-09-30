import { UploadedFile ,UseInterceptors, BadRequestException, Controller, UseGuards, Get, Post, Patch, Put, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from "@/auth/guard/jwt-auth.guard";
import { RolesGuard } from "@/auth/guard/roles.guard";
import { Roles } from "@/auth/decorator/roles.decorator";
import { UserRole } from "@prisma/client";
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAppReleaseDto } from "@/app-release/dto/create-app-release.dto";
import { UsersService } from "@/users/users.service";
import { AlbumsService } from "@/albums/albums.service";
import { TracksService } from "@/tracks/tracks.service";
import { GenresService } from "@/genres/genres.service";
import { TagsService } from "@/tags/tags.service";
import { AppReleaseService } from "@/app-release/app-release.service";
import { AdminUpdateUserStatusDto } from "@/users/dto/admin-update-user-status.dto";
import { AdminUpdateUserRoleDto } from "@/users/dto/admin-update-user-role.dto";
import { AdminTrackQueryDto } from "@/tracks/dto/admin-track-query.dto";
import { AdminUpdateTrackStatusDto } from "@/tracks/dto/admin-update-track-status.dto";
import { AdminAlbumQueryDto } from "@/albums/dto/admin-album-query.dto";
import { AdminUpdateAlbumStatusDto } from "@/albums/dto/admin-update-album-status.dto";
import { CreateGenreDto } from "@/genres/dto/create-genre.dto";
import { UpdateGenreDto } from "@/genres/dto/update-genre.dto";
import { CreateTagDto } from "@/tags/dto/create-tag.dto";
import { UpdateTagDto } from "@/tags/dto/update-tag.dto";
import { AppPlatform } from "@prisma/client";

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly usersService: UsersService, private readonly albumsService: AlbumsService, private readonly tracksService: TracksService, private readonly genresService: GenresService, private readonly tagsService: TagsService, private readonly appReleaseService: AppReleaseService) {}

    @Get('users')
    async findAll() {
        return this.usersService.findAll();
    }

    @Get('users/:id')
    async findByIdForAdmin(@Param('id') id: string) {
        return this.usersService.findByIdForAdmin(id);
    }

    @Patch("users/:id/status")
    async updateUserStatus(
        @Param("id") id: string,
        @Body() dto: AdminUpdateUserStatusDto,
        @Req() req: any,
    ) {
        if (id === req.user.id) {
            throw new BadRequestException(
                "You cannot change your own status",
            );
        }

        return this.usersService.updateUserStatus(
            id,
            dto.status,
        );
    }

    @Patch("users/:id/role")
    async updateUserRole(
        @Param("id") id: string,
        @Body() dto: AdminUpdateUserRoleDto,
        @Req() req: any,
    ) {
        if (id === req.user.id) {
            throw new BadRequestException(
                "You cannot change your own role",
            );
        }

        return this.usersService.updateUserRole(
            id,
            dto.role,
        );
    }

    @Delete("users/:id")
    async deleteUser(
        @Param("id") id: string,
        @Req() req: any,
    ) {
        if (id === req.user.id) {
            throw new BadRequestException(
                "You cannot delete your own account",
            );
        }

        return this.usersService.deleteUser(id);
    }

    @Patch("users/:id/restore")
    async restoreUser(@Param("id") id: string) {
        return this.usersService.restoreUser(id);
    }

    @Get('albums')
    async findAllAlbums(@Query() query: AdminAlbumQueryDto) {
        return this.albumsService.findAllForAdmin(query);
    }

    @Get('albums/:id')
    async findAlbumByIdForAdmin(@Param('id') id: string) {
        return this.albumsService.findByIdForAdmin(id);
    }

    @Patch('albums/:id/status')
    async updateAlbumStatus(
        @Param('id') id: string,
        @Body() dto: AdminUpdateAlbumStatusDto,
    ) {
        return this.albumsService.updateAlbumStatus(id, dto.status);
    }

    @Delete('albums/:id')
    async deleteAlbum(@Param('id') id: string) {
        return this.albumsService.deleteAlbumForAdmin(id);
    }

    @Get('tracks')
    async findAllTracks(@Query() query: AdminTrackQueryDto) {
        return this.tracksService.findAllForAdmin(query);
    }

    @Get('tracks/:id')
    async findTrackByIdForAdmin(@Param('id') id: string) {
        return this.tracksService.findByIdForAdmin(id);
    }

    @Patch('tracks/:id/status')
    async updateTrackStatus(
        @Param('id') id: string,
        @Body() dto: AdminUpdateTrackStatusDto,
    ) {
        return this.tracksService.updateTrackStatus(id, dto.status);
    }

    @Delete('tracks/:id')
    async deleteTrack(@Param('id') id: string) {
        return this.tracksService.deleteTrackForAdmin(id);
    }

    @Get('genres')
    async findAllGenres() {
        return this.genresService.findAll();
    }

    @Get('genres/:id')
    async findGenreByIdForAdmin(@Param('id') id: string) {
        return this.genresService.findByIdForAdmin(id);
    }

    @Post('genres')
    async createGenre(@Body() dto: CreateGenreDto) {
        return this.genresService.createForAdmin(dto);
    }

    @Patch('genres/:id')
    async updateGenre(
        @Param('id') id: string,
        @Body() dto: UpdateGenreDto,
    ) {
        return this.genresService.updateForAdmin(id, dto);
    }

    @Delete('genres/:id')
    async deleteGenre(@Param('id') id: string) {
        return this.genresService.deleteForAdmin(id);
    }

    @Get('tags')
    async findAllTags() {
        return this.tagsService.findAll();
    }

    @Get('tags/:id')
    async findTagByIdForAdmin(@Param('id') id: string) {
        return this.tagsService.findByIdForAdmin(id);
    }

    @Post('tags')
    async createTag(@Body() dto: CreateTagDto) {
        return this.tagsService.createForAdmin(dto);
    }

    @Patch('tags/:id')
    async updateTag(
        @Param('id') id: string,
        @Body() dto: UpdateTagDto,
    ) {
        return this.tagsService.updateForAdmin(id, dto);
    }

    @Delete('tags/:id')
    async deleteTag(@Param('id') id: string) {
        return this.tagsService.deleteForAdmin(id);
    }

  @Put('app-releases/:platform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  upsert(
    @Param('platform') platform: AppPlatform,
    @Body() dto: CreateAppReleaseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.appReleaseService.upsert(
      platform,
      dto,
      file,
    );
  }

  @Delete('app-releases/:platform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(
    @Param('platform') platform: AppPlatform,
  ) {
    return this.appReleaseService.remove(platform);
  }
}
