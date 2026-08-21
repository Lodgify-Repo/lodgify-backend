import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchHotelsDto } from '../dto/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('hotels')
  @ApiOperation({ summary: 'Search hotels' })
  async searchHotels(@Query() searchDto: SearchHotelsDto) {
    return this.searchService.searchHotels(searchDto);
  }
}
