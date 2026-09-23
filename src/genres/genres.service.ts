import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenresService {
    constructor(private prisma: PrismaService) {}

    private async generateUniqueSlug(name: string, excludedId?: string): Promise<string> {
        const baseSlug = slugify(name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 2;

        while (await this.prisma.genre.findFirst({
            where: {
                slug,
                ...(excludedId ? { id: { not: excludedId } } : {}),
            },
        })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

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

    async findByIdForAdmin(id: string) {
        const genre = await this.prisma.genre.findUnique({
            where: { id },
            include: {
                _count: { select: { trackGenres: true } },
            },
        });

        if (!genre) {
            throw new NotFoundException('Genre not found');
        }

        return genre;
    }

    async createForAdmin(dto: CreateGenreDto) {
        const name = dto.name.trim();
        const slug = await this.generateUniqueSlug(name);

        try {
            return await this.prisma.genre.create({
                data: { name, slug },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Genre name already exists');
            }
            throw error;
        }
    }

    async updateForAdmin(id: string, dto: UpdateGenreDto) {
        const existing = await this.prisma.genre.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Genre not found');
        }

        const name = dto.name.trim();
        const slug = await this.generateUniqueSlug(name, id);

        try {
            return await this.prisma.genre.update({
                where: { id },
                data: { name, slug },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Genre name already exists');
            }
            throw error;
        }
    }

    async deleteForAdmin(id: string) {
        const genre = await this.prisma.genre.findUnique({
            where: { id },
            include: { _count: { select: { trackGenres: true } } },
        });

        if (!genre) {
            throw new NotFoundException('Genre not found');
        }
        if (genre._count.trackGenres > 0) {
            throw new BadRequestException('Cannot delete a genre used by tracks');
        }

        return this.prisma.genre.delete({ where: { id } });
    }
}
