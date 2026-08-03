import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import slugify from "slugify";

@Injectable()
export class TagsService {
    constructor(private prisma: PrismaService) {}

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
}