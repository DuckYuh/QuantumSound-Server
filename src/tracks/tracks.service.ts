import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UploadTrackDto } from './dto/UploadTrack.dto';
import { UpdateTrackDto } from './dto/UpdateTrack.dto';
import { UploadService } from '@/upload/upload.service';
import slugify from "slugify";
import { parseBuffer } from "music-metadata";
import { AlbumType } from '@prisma/client';

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

    async deleteTrack(userId: string, trackId: string) {
        const track = await this.prisma.track.findUnique({
            where: {
                id: trackId,
            },
        });

        if (!track) {
            throw new BadRequestException("Track not found");
        }

        if (track.artistId !== userId) {
            throw new ForbiddenException("You are not allowed to delete this track");
        }

        if (track.audioUrl) {
            await this.UploadService.deleteFile(track.audioUrl);
        }

        const trackGenres = await this.prisma.trackGenre.findMany({
            where: {
                trackId: trackId,
            },
        });
        if (trackGenres.length > 0) {
            await this.prisma.trackGenre.deleteMany({
                where: {
                    trackId: trackId,
                },
            });
        }

        const trackTags = await this.prisma.trackTag.findMany({
            where: {
                trackId: trackId,
            },
        });
        if (trackTags.length > 0) {
            await this.prisma.trackTag.deleteMany({
                where: {
                    trackId: trackId,
                },
            });
        }

        const trackInPlaylists = await this.prisma.playlistTrack.findMany({
            where: {
                trackId: trackId,
            },
        });
        if (trackInPlaylists.length > 0) {
            await this.prisma.playlistTrack.deleteMany({
                where: {
                    trackId: trackId,
                },
            });
        }

        await this.prisma.track.delete({
            where: {
                id: trackId,
            },
        });
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

    async findAll() {
        return this.prisma.track.findMany();
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
}
