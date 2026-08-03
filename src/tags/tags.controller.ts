import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
    constructor(private tagsService: TagsService) {}

    @Get()
    findAll() {
        return this.tagsService.findAll();
    }

    @Get('search')
    findByQuery(
        @Query("query") query: string,
    ) {
        return this.tagsService.findByQuery(query);
    }
}
