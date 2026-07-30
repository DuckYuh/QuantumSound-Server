import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UploadTrackDto } from './dto/UploadTrack.dto';
import { UploadService } from '@/upload/upload.service';
import slugify from "slugify";
import { parseBuffer } from "music-metadata";
import { AlbumType } from '@prisma/client';

@Injectable()
export class TracksService {
    constructor(private readonly prisma: PrismaService, private readonly UploadService: UploadService) {}

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
            return this.prisma.track.create({
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
            });
        } catch(error) {
            await this.prisma.album.delete({
                where:{
                    id: album.id
                }
            });
            throw error;
        }
    }

    async findAll() {
        return this.prisma.track.findMany();
    }

    async findAlbumTracks(albumId: string) {
        return this.prisma.track.findMany({
            where: {
                albumId: albumId,
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
        });
    }
}
