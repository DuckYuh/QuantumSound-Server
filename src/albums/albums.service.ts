import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import slugify from "slugify";
import { UploadService } from '@/upload/upload.service';

@Injectable()
export class AlbumsService {
    constructor(private readonly prisma: PrismaService, private readonly uploadService: UploadService) {}

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

    async findAll() {
        return this.prisma.album.findMany();
    }

    async findUserAlbums(username: string) {
        return this.prisma.album.findMany({
            where: {
                artist: {
                    username: username
                }
            },
        });
    }

    async getAlbumById(albumId: string) {
        return this.prisma.album.findUnique({
            where: {
                id: albumId,
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
            },
        });
    }

    async getAlbumBySlug(slug: string) {
        return this.prisma.album.findUnique({
            where: {
                slug,
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
            },
        });
    }
}
