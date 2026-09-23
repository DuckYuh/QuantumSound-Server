import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import slugify from "slugify";
import { Prisma } from '@prisma/client';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
    constructor(private prisma: PrismaService) {}

    private async generateUniqueAdminSlug(name: string, excludedId?: string): Promise<string> {
        const baseSlug = slugify(name, {
            lower: true,
            strict: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (await this.prisma.tag.findFirst({
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

    async generateUniqueSlug(name: string): Promise<string> {
        const baseSlug = slugify(name, {
            lower: true,
            strict: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (await this.prisma.tag.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }
    
    async createTags(tagNames: string) {
        const slug = await this.generateUniqueSlug(tagNames);
        return this.prisma.tag.create({
            data: {
                name: tagNames,
                slug: slug,
            },
        });
    }

    async findAll() {
        return this.prisma.tag.findMany({
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
        return this.prisma.tag.findMany({
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
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: {
                _count: { select: { trackTags: true } },
            },
        });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        return tag;
    }

    async createForAdmin(dto: CreateTagDto) {
        const name = dto.name.trim();
        const slug = await this.generateUniqueAdminSlug(name);

        try {
            return await this.prisma.tag.create({
                data: { name, slug },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Tag name already exists');
            }
            throw error;
        }
    }

    async updateForAdmin(id: string, dto: UpdateTagDto) {
        const existing = await this.prisma.tag.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Tag not found');
        }

        const name = dto.name.trim();
        const slug = await this.generateUniqueAdminSlug(name, id);

        try {
            return await this.prisma.tag.update({
                where: { id },
                data: { name, slug },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Tag name already exists');
            }
            throw error;
        }
    }

    async deleteForAdmin(id: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: { _count: { select: { trackTags: true } } },
        });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }
        if (tag._count.trackTags > 0) {
            throw new BadRequestException('Cannot delete a tag used by tracks');
        }

        return this.prisma.tag.delete({ where: { id } });
    }
}