import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePlaylistDto } from './dto/CreatePlaylists.dto';
import { AddTrackDto } from './dto/AddTrackDto.dto';
import { UpdatePlaylistDto } from './dto/UpdatePlaylist.dto';
import { UploadService } from '@/upload/upload.service';

@Injectable()
export class PlaylistsService {
    constructor(private readonly prisma: PrismaService, private readonly uploadService: UploadService) {}

    async createPlaylist(userId: string, dto: CreatePlaylistDto) {
        return this.prisma.playlist.create({
            data: {
                title: dto.title,
                description: dto.description,
                visibility: dto.visibility,
                ownerId: userId
            }
        });
    }

    async addTrackToPlaylist(userId: string, dto: AddTrackDto) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: dto.playlistId }
        });

        if (!playlist || playlist.ownerId !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        const existed = await this.prisma.playlistTrack.findUnique({
            where: {
                playlistId_trackId: {
                    playlistId: dto.playlistId,
                    trackId: dto.trackId,
                },
            },
        });

        if (existed) {
            throw new BadRequestException("Track already exists in playlist");
        }

        return await this.prisma.$transaction([
            this.prisma.playlistTrack.create({
                data: {
                    playlistId: dto.playlistId,
                    trackId: dto.trackId,
                },
            }),
            this.prisma.playlist.update({
                where: {
                    id: dto.playlistId,
                },
                data: {
                    trackCount: {
                        increment: 1,
                    },
                },
            }),
        ]);
    }

    async updatePlaylist(userId: string, playlistId: string, dto: UpdatePlaylistDto, coverFile?: Express.Multer.File) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId }
        });

        if (!playlist || playlist.ownerId !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        if (coverFile) {
            if (playlist.coverImage) {
                await this.uploadService.deleteFile(playlist.coverImage);
            }
            const coverUrl = await this.uploadService.uploadFile(coverFile, `playlists/${playlistId}/covers`);
            dto.coverUrl = coverUrl.url;
        }

        return this.prisma.playlist.update({
            where: { id: playlistId },
            data: {
                title: dto.title,
                description: dto.description,
                visibility: dto.visibility,
                coverImage: dto.coverUrl
            }
        });
    }

    async deletePlaylist(userId: string, playlistId: string) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId }
        });

        if (!playlist || playlist.ownerId !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        if (playlist.trackCount > 0) {
            await this.prisma.playlistTrack.deleteMany({
                where: { playlistId: playlistId }
            });
        }

        return this.prisma.playlist.delete({
            where: { id: playlistId }
        });
    }

    async removeTrackFromPlaylist(userId: string, playlistId: string, trackId: string) {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id: playlistId }
        });
        if (!playlist || playlist.ownerId !== userId) {
            throw new BadRequestException('Unauthorized');
        }
        const trackInPlaylist = await this.prisma.playlistTrack.findUnique({
            where: {
                playlistId_trackId: {
                    playlistId: playlistId,
                    trackId: trackId,
                },
            },
        });
        if (!trackInPlaylist) {
            throw new BadRequestException('Track not found in playlist');
        }

        this.prisma.playlistTrack.delete({
            where: {
                playlistId_trackId: {
                    playlistId: playlistId,
                    trackId: trackId,
                },
            },
        });

        return this.prisma.playlist.update({
            where: { id: playlistId },
            data: {
                trackCount: {
                    decrement: 1,
                },
            },
        });
    }

    async getUserPlaylists(username: string) {
        return this.prisma.playlist.findMany({
            where: { 
                owner: {
                    username: username
                }
            },
            include: { 
                tracks: true,
                owner: true
            }
        });
    }

    async getPlaylistById(playlistId: string) {
        return this.prisma.playlist.findUnique({
            where: { 
                id: playlistId 
            },
            include: { 
                tracks: true,
                owner: true
            }
        });
    }

    async GetAll() {
        return this.prisma.playlist.findMany({
            include: { 
                tracks: true,
                owner: true
            }
        });
    }
}
