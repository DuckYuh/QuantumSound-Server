import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private searchService: SearchService) {}
    
    @Get()
    search(
        @Query("query") query: string,
        @Query('limit') limit?: string,
    ) {
        return this.searchService.search(query, limit ? Number(limit) : 3);
    }
}
