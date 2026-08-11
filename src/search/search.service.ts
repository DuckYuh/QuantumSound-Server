import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) {}

    async search(query: string, limit = 3) {
        const q = query.trim();

        if (!q) {
            return {
                tracks: [],
                albums: [],
                users: [],
            };
        }

        const safeLimit = Math.min(Math.max(limit, 1), 20);

        const [tracks, albums, users] = await Promise.all([
            this.prisma.track.findMany({
                where: {
                    title: {
                        contains: q,
                        mode: 'insensitive',
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
                take: safeLimit,
            }),

            this.prisma.album.findMany({
                where: {
                    title: {
                        contains: q,
                        mode: 'insensitive',
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
                take: safeLimit,
            }),

            this.prisma.user.findMany({
                where: {
                    OR: [
                        {
                            displayName: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },
                        {
                            username: {
                                contains: q,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                },
                take: safeLimit,
            }),
        ]);

        return {
            tracks,
            albums,
            users,
        };
    }
}