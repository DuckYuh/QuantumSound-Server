import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import slugify from "slugify";

@Injectable()
export class AlbumsService {
    constructor(private readonly prisma: PrismaService) {}

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

    async create(userId:string, data: CreateAlbumDto) {
        const slug = await this.generateUniqueSlug(data.title);
        return this.prisma.album.create({
            data: {
                title: data.title,
                slug: slug,
                type: data.type,
                description: data.description,
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
        });
    }
}
