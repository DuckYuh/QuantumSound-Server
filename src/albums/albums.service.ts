import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/updateAlbum.dto';
import slugify from "slugify";
import { UploadService } from '@/upload/upload.service';
import { TracksService } from '@/tracks/tracks.service';

@Injectable()
export class AlbumsService {
    constructor(private readonly prisma: PrismaService, private readonly uploadService: UploadService, private readonly tracksService: TracksService) {}

    private async generateUniqueSlug(title: string): Promise<string> {
        const baseSlug = slugify(title, {
            lower: true,
            strict: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (await this.prisma.album.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    async create(userId:string, data: CreateAlbumDto, coverFile?: Express.Multer.File) {
        if (!coverFile) {
            throw new BadRequestException("Cover file is required");
        }
        const slug = await this.generateUniqueSlug(data.title);
        const coverImageUrl = await this.uploadService.uploadFile(coverFile, `albums/${slug}/covers`);
        return this.prisma.album.create({
            data: {
                title: data.title,
                slug: slug,
                type: data.type,
                description: data.description,
                coverImage: coverImageUrl.url,
                artistId: userId
            }
        });
    }

    async deleteAlbum(userId: string, albumId: string) {
        const album = await this.prisma.album.findUnique({
            where: { id: albumId },
            include: {
                tracks: true
            }
        });
        if (!album) {
            throw new BadRequestException("Album not found");
        }
        if (album.artistId !== userId) {
            throw new BadRequestException("You are not the owner of this album");
        }
        if (album.coverImage) {
            await this.uploadService.deleteFile(album.coverImage);
        }
        if (album.tracks && album.tracks.length > 0) {
            for (const track of album.tracks) {
                await this.tracksService.deleteTrack(userId, track.id);
            }
        }
        return this.prisma.album.delete({
            where: { id: albumId },
        });
    }

    async updateAlbum(userId: string, albumId: string, data: UpdateAlbumDto, coverFile?: Express.Multer.File) {
        const album = await this.prisma.album.findUnique({
            where: { id: albumId },
        });
        if (!album) {
            throw new BadRequestException("Album not found");
        }
        if (album.artistId !== userId) {
            throw new BadRequestException("You are not the owner of this album");
        }
        // Handle cover image update
        let coverImageUrl: string | undefined;
        if (coverFile) {
            if (album.coverImage) {
                await this.uploadService.deleteFile(album.coverImage);
            }
            const uploadedCover = await this.uploadService.uploadFile(coverFile, `albums/${album.slug}/covers`);
            coverImageUrl = uploadedCover.url;
        }

        let newSlug = album.slug;
        if (data.title && data.title !== album.title) {
            newSlug = await this.generateUniqueSlug(data.title);
        }
        // Update album data
        return this.prisma.album.update({
            where: { id: albumId },
            data: {
                ...data,
                slug: newSlug,
                coverImage: coverImageUrl
            }
        });
    }

    async reOrderAlbumTracks(userId: string, albumId: string, trackIds: string[]) {
        const album = await this.prisma.album.findUnique({
            where: { id: albumId },
            include: {
                tracks: {
                    select: {
                        id: true,
                    },
                    orderBy: {
                        trackNumber: 'asc',
                    },
                },
            },
        });
        if (!album) {
            throw new BadRequestException("Album not found");
        }
        if (album.artistId !== userId) {
            throw new BadRequestException("You are not the owner of this album");
        }

        const uniqueTrackIds = [...new Set(trackIds)];
        if (uniqueTrackIds.length !== trackIds.length) {
            throw new BadRequestException('trackIds contains duplicates');
        }

        const albumTrackIds = album.tracks.map((track) => track.id);
        if (uniqueTrackIds.length !== albumTrackIds.length) {
            throw new BadRequestException('trackIds must contain every track in the album');
        }

        const albumTrackIdSet = new Set(albumTrackIds);
        const hasInvalidTrack = uniqueTrackIds.some((trackId) => !albumTrackIdSet.has(trackId));
        if (hasInvalidTrack) {
            throw new BadRequestException('trackIds must contain only tracks from this album');
        }

        const orderedUpdates = uniqueTrackIds.map((trackId, index) =>
            this.prisma.track.update({
                where: { id: trackId },
                data: { trackNumber: index + 1 },
            }),
        );

        await this.prisma.$transaction(orderedUpdates);

        return this.prisma.track.findMany({
            where: { albumId },
            orderBy: { trackNumber: 'asc' },
        });
    }

    async findAll() {
        return this.prisma.album.findMany({
            include: {
                artist: true,
                tracks: true,
            }
        });
    }

    async findUserAlbums(username: string) {
        return this.prisma.album.findMany({
            where: {
                artist: {
                    username: username
                }
            },
            include: {
                artist: true,
                tracks: true,
            }
        });
    }

    async getAlbumById(albumId: string) {
        return this.prisma.album.findUnique({
            where: {
                id: albumId,
            },
            include: {
                artist: true,
                tracks: true,
            },
        });
    }

    async getAlbumBySlug(slug: string) {
        return this.prisma.album.findUnique({
            where: {
                slug,
            },
            include: {
                artist: true,
                tracks: true,
            },
        });
    }
}
