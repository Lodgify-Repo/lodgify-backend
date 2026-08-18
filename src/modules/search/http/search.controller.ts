import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchHotelsDto } from '../dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('hotels')
  async searchHotels(@Query() searchDto: SearchHotelsDto) {
    return this.searchService.searchHotels(searchDto);
  }
}
