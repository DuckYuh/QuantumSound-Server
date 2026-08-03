import { Controller, Get,Query } from '@nestjs/common';
import { GenresService } from './genres.service';

@Controller('genres')
export class GenresController {
  constructor(private genresService: GenresService) {}

  @Get()
  findAll() {
    return this.genresService.findAll();
  }

  @Get('search')
  findByQuery(
    @Query("query") query: string,
  ) {
    return this.genresService.findByQuery(query);
  }
}
