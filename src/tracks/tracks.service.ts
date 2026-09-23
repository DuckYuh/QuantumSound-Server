import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UploadTrackDto } from './dto/UploadTrack.dto';
import { UpdateTrackDto } from './dto/UpdateTrack.dto';
import { UploadService } from '@/upload/upload.service';
import slugify from "slugify";
import { parseBuffer } from "music-metadata";
import { AlbumType, Prisma, TrackStatus } from '@prisma/client';
import { AdminTrackQueryDto } from './dto/admin-track-query.dto';

type TrackRelationClient = {
    genre: {
        findUnique: (args: { where: { name: string } }) => Promise<{ id: string; name: string; slug: string } | null>;
    };
    trackGenre: {
        create: (args: { data: { trackId: string; genreId: string } }) => Promise<unknown>;
        deleteMany: (args: { where: { trackId: string } }) => Promise<unknown>;
    };
    tag: {
        findUnique: (args: { where: { name?: string; slug?: string } }) => Promise<{ id: string; name: string; slug: string } | null>;
        create: (args: { data: { name: string; slug: string } }) => Promise<{ id: string; name: string; slug: string }>;
    };
    trackTag: {
        create: (args: { data: { trackId: string; tagId: string } }) => Promise<unknown>;
        deleteMany: (args: { where: { trackId: string } }) => Promise<unknown>;
    };
};

@Injectable()
export class TracksService {
    constructor(private readonly prisma: PrismaService, private readonly UploadService: UploadService) {}

    private async generateUniqueTagSlug(client: TrackRelationClient, name: string): Promise<string> {
        const baseSlug = slugify(name, {
            lower: true,
            strict: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (await client.tag.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private async generateUniqueSlug(title: string): Promise<string> {
        const baseSlug = slugify(title, {
            lower: true,
            strict: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (await this.prisma.track.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private async attachGenres(client: TrackRelationClient, trackId: string, genres: string[]) {
        for (const name of [...new Set(genres)]) {
            const genre = await client.genre.findUnique({
                where: { name },
            });
            if (!genre) {
                throw new BadRequestException(`Genre not found: ${name}`);
            }
            await client.trackGenre.create({
                data: {
                    trackId,
                    genreId: genre.id,
                },
            });
        }
    }

    private async attachTags(client: TrackRelationClient, trackId: string, tags: string[]) {
        for (const name of [...new Set(tags)]) {
            let tag = await client.tag.findUnique({
                where: { name },
            });
            if (!tag) {
                tag = await client.tag.create({
                    data: {
                        name,
                        slug: await this.generateUniqueTagSlug(client, name),
                    },
                });
            }
            await client.trackTag.create({
                data: {
                    trackId,
                    tagId: tag.id,
                },
            });
        }
    }

    async upload(userId:string, file:Express.Multer.File, dto:UploadTrackDto) {        
        if (!file) {
            throw new BadRequestException("Audio file is required");
        }

        if (!file.mimetype.startsWith("audio/")) {
            throw new BadRequestException("Invalid audio file");
        }

        const album = await this.prisma.album.findFirst({
            where: {
                artistId: userId,
                id: dto.albumId,
            }
        });

        if(!album){
            throw new ForbiddenException();
        }

        let trackNumber = 0;

        if (album.type === AlbumType.SINGLE) {
            const count = await this.prisma.track.count({
                where: {
                    albumId: album.id,
                },
            });

            if (count >= 1) {
                throw new BadRequestException('Single album can only contain one track.', );
            }

            trackNumber = 1;
        } 
        else {
            const trackCount = await this.prisma.track.count({
                where: {
                    albumId: album.id,
                },
            });
            trackNumber = trackCount + 1;
        }

        const slug = await this.generateUniqueSlug(dto.title);

        const metadata = await parseBuffer(file.buffer, file.mimetype);

        const duration = Math.round(metadata.format.duration ?? 0);

        const audioUrl = await this.UploadService.uploadFile(file, `tracks/${userId}/${album.slug}`);

        try {
            const track = await this.prisma.track.create({
                data: {
                    title: dto.title,
                    slug: slug,
                    description: dto.description,
                    audioUrl: audioUrl.url,
                    coverImage: dto.coverImage,
                    duration: duration,
                    trackNumber: trackNumber,
                    visibility: dto.visibility,
                    albumId: dto.albumId,
                    artistId: userId
                }
            })
            await this.attachGenres(this.prisma, track.id, dto.genres ?? []);
            await this.attachTags(this.prisma, track.id, dto.tags ?? []);
            return track;
        } catch(error) {
            const trackCount = await this.prisma.track.count({
                where: {
                    albumId: album.id,
                },
            });
            if (trackCount === 0) {
                await this.prisma.album.delete({
                    where: {
                        id: album.id,
                    },
                });
            }
            throw error;
        }
    }

    private async hardDeleteTrack(trackId: string) {
        const track = await this.prisma.track.findUnique({
            where: {
                id: trackId,
            },
        });

        if (!track) {
            throw new NotFoundException("Track not found");
        }

        await this.prisma.$transaction(async (tx) => {
            const playlistTracks = await tx.playlistTrack.findMany({
                where: { trackId },
                select: { playlistId: true },
            });

            await tx.comment.deleteMany({ where: { trackId } });
            await tx.trackLike.deleteMany({ where: { trackId } });
            await tx.listeningHistory.deleteMany({ where: { trackId } });
            await tx.report.deleteMany({ where: { trackId } });
            await tx.trackGenre.deleteMany({ where: { trackId } });
            await tx.trackTag.deleteMany({ where: { trackId } });
            await tx.playlistTrack.deleteMany({ where: { trackId } });

            for (const { playlistId } of playlistTracks) {
                await tx.playlist.update({
                    where: { id: playlistId },
                    data: { trackCount: { decrement: 1 } },
                });
            }

            await tx.track.delete({ where: { id: trackId } });
        });

        await Promise.all([
            track.audioUrl ? this.UploadService.deleteFile(track.audioUrl) : Promise.resolve(),
            track.coverImage ? this.UploadService.deleteFile(track.coverImage) : Promise.resolve(),
        ]);

        return track;
    }

    async deleteTrack(userId: string, trackId: string) {
        const track = await this.prisma.track.findUnique({
            where: { id: trackId },
            select: { artistId: true },
        });

        if (!track) {
            throw new NotFoundException("Track not found");
        }

        if (track.artistId !== userId) {
            throw new ForbiddenException("You are not allowed to delete this track");
        }

        return this.hardDeleteTrack(trackId);
    }

    async updateTrack(userId: string, trackId: string, dto: UpdateTrackDto, coverFile?: Express.Multer.File) {
        const track = await this.prisma.track.findUnique({
            where: {
                id: trackId,
            },
        });
        if (!track) {
            throw new BadRequestException("Track not found");
        }
        if (track.artistId !== userId) {
            throw new ForbiddenException("You are not allowed to update this track");
        }
        let newSlug = track.slug;
        if (dto.title && dto.title !== track.title) {
            const slug = await this.generateUniqueSlug(dto.title);
            newSlug = slug;
        }
        let coverImage = track.coverImage;
        if (coverFile) {
            if (!coverFile.mimetype.startsWith("image/")) {
                throw new BadRequestException("Invalid cover image file");
            }
            if (track.coverImage) {
                await this.UploadService.deleteFile(track.coverImage);
            }
            const coverImageUrl = await this.UploadService.uploadFile(coverFile, `tracks/${userId}/${track.slug}/cover`);
            coverImage = coverImageUrl.url;
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedTrack = await tx.track.update({
                where: { id: trackId },
                data: {
                    title: dto.title,
                    slug: newSlug,
                    description: dto.description,
                    coverImage: coverImage,
                    visibility: dto.visibility,
                    status: dto.status,
                },
            });

            // update genres
            if (dto.genres) {
                await tx.trackGenre.deleteMany({
                    where: { trackId },
                });

                await this.attachGenres(tx, trackId, dto.genres);
            }

            // update tags
            if (dto.tags) {
                await tx.trackTag.deleteMany({
                    where: { trackId },
                });

                await this.attachTags(tx, trackId, dto.tags);
            }

            return updatedTrack;
        });
    }

    async recordListen(userId: string, trackId: string) {
        return this.prisma.$transaction(async (tx) => {
            await tx.listeningHistory.create({
                data: {
                    userId,
                    trackId,
                },
            });

            return tx.track.update({
                where: {
                    id: trackId,
                },
                data: {
                    playCount: {
                        increment: 1,
                    },
                },
            });
        });
    }

    async getPopularTracks(userId: string, limit = 10) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);

        return this.prisma.track.findMany({
            where: {
                artistId: userId,
                album: {
                    status: "RELEASED",
                },
            },
            orderBy: {
                playCount: 'desc',
            },
            take: safeLimit,
            include: {
                artist: true,
                album: true,
            },
        });
    }

    async likeTrack(userId: string, trackId: string) {
        return this.prisma.$transaction(async (tx) => {
            const existingLike = await tx.trackLike.findUnique({
                where: {
                    userId_trackId: {
                        userId,
                        trackId,
                    },
                },
            });

            if (existingLike) {
                return existingLike;
            }

            await tx.trackLike.create({
                data: {
                    userId,
                    trackId,
                },
            });

            await tx.track.update({
                where: {
                    id: trackId,
                },
                data: {
                    likeCount: {
                        increment: 1,
                    },
                },
            });

            return {
                liked: true,
            };
        });
    }

    async unlikeTrack(userId: string, trackId: string) {
        return this.prisma.$transaction(async (tx) => {
            const existingLike = await tx.trackLike.findUnique({
                where: {
                    userId_trackId: {
                        userId,
                        trackId,
                    },
                },
            });

            if (!existingLike) {
                return;
            }

            await tx.trackLike.delete({
                where: {
                    userId_trackId: {
                        userId,
                        trackId,
                    },
                },
            });

            await tx.track.update({
                where: {
                    id: trackId,
                },
                data: {
                    likeCount: {
                        decrement: 1,
                    },
                },
            });

            return {
                liked: false,
            };
        });
    }

    async getIsLiked(userId: string, trackId: string) {
        const like = await this.prisma.trackLike.findUnique({
            where: {
                userId_trackId: {
                    userId,
                    trackId,
                },
            },
        });
        return !!like;
    }

    async getTrackComments(trackId: string) {
        return this.prisma.comment.findMany({
            where: {
                trackId,
            },
            include: {
                user: true,
            },
        });
    }

    async getTrackCommentsCount(trackId: string) {
        return this.prisma.comment.count({
            where: {
                trackId,
            },
        });
    }

    async findAll() {
        return this.prisma.track.findMany();
    }

    async findAllForAdmin(query: AdminTrackQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const search = query.search?.trim();
        const where: Prisma.TrackWhereInput = {
            ...(query.status ? { status: query.status } : {}),
            ...(query.artistId ? { artistId: query.artistId } : {}),
            ...(search
                ? {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { slug: { contains: search, mode: 'insensitive' } },
                        { artist: { username: { contains: search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.track.findMany({
                where,
                include: {
                    artist: {
                        select: { id: true, username: true, displayName: true, avatar: true },
                    },
                    album: {
                        select: { id: true, title: true, slug: true, coverImage: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.track.count({ where }),
        ]);

        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findByIdForAdmin(trackId: string) {
        const track = await this.GetTrackById(trackId);
        if (!track) {
            throw new NotFoundException('Track not found');
        }
        return track;
    }

    async updateTrackStatus(trackId: string, status: TrackStatus) {
        try {
            return await this.prisma.track.update({
                where: { id: trackId },
                data: { status },
                include: { artist: true, album: true },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Track not found');
            }
            throw error;
        }
    }

    async deleteTrackForAdmin(trackId: string) {
        return this.hardDeleteTrack(trackId);
    }

    async findAlbumTracks(albumId: string) {
        return this.prisma.track.findMany({
            where: {
                albumId: albumId,
            },
            include: {
                artist: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
                album: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        coverImage: true,
                    },
                },
                genres: {
                    include: {
                        genre: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
            orderBy: {
                trackNumber: "asc",
            },
        });
    }

    async GetTrackById(trackId: string) {
        return this.prisma.track.findUnique({
            where: {
                id: trackId,
            },
            include: {
                artist: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
                album: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        coverImage: true,
                        slug: true,
                    },
                },
                genres: {
                    include: {
                        genre: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
    }

    async getMostPopularTracks(limit = 50) {
        const take = Math.min(limit, 50);

        return this.prisma.track.findMany({
            where: {
                album: {
                    status: "RELEASED",
                },
            },
            orderBy: {
                playCount: "desc",
            },
            take,
            include: {
                artist: true,
                album: true,
            },
        });
    }

    async getMostLikedTracks(limit = 50) {
        const take = Math.min(limit, 50);

        return this.prisma.track.findMany({
            where: {
                album: {
                    status: "RELEASED",
                },
            },
            orderBy: {
                likeCount: "desc",
            },
            take,
            include: {
                artist: true,
                album: true,
            },
        });
    }

    async getLikedTracks(userId: string) {
        return this.prisma.trackLike.findMany({
            where: {
                userId,
            },
            include: {
                user: true,
                track: {
                    include: {
                        album: true,
                        artist: true,
                    }
                },
            },
        });
    }
}
