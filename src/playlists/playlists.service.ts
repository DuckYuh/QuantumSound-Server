import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePlaylistDto } from './dto/CreatePlaylists.dto';
import { AddTrackDto } from './dto/AddTrackDto.dto';

@Injectable()
export class PlaylistsService {
    constructor(private readonly prisma: PrismaService) {}

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
