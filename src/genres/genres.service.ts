import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GenresService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.genre.findMany({
        orderBy: {
            name: 'asc'
        },
        select: {
            id: true,
            name: true,
            slug: true,
        }
        });
    }

    async findByQuery(query: string) {
        return this.prisma.genre.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
            take: 5,
        });
    }
}
