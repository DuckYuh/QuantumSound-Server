import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) {}

    async search(query: string) {
        const tracks = await this.prisma.track.findMany({
            where: {
                title: {
                    contains: query,
                    mode: "insensitive",
                },
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
                        slug: true,
                        coverImage: true,
                    },
                },
            },
            take: 3,
        });

        const albums = await this.prisma.album.findMany({
            where: {
                title: {
                    contains: query,
                    mode: "insensitive",
                },
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
            take: 3,
        });

        const users = await this.prisma.user.findMany({
            where: {
                displayName: {
                    contains: query,
                    mode: "insensitive",
                },
            },
            take: 3,
        });

         return {
            tracks,
            albums,
            users,
        };
    }
}
