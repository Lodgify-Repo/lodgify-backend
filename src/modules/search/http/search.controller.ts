import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchHotelsDto, SearchPropertiesDto, AutocompleteDto } from '../dto/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('hotels')
  @ApiOperation({ summary: 'Search hotels' })
  async searchHotels(@Query() searchDto: SearchHotelsDto) {
    return this.searchService.searchHotels(searchDto);
  }

  @Get('properties')
  @ApiOperation({ summary: 'Search properties' })
  async searchProperties(@Query() searchDto: SearchPropertiesDto) {
    return this.searchService.searchProperties(searchDto);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete locations, hotels, and properties' })
  async autocomplete(@Query() searchDto: AutocompleteDto) {
    return this.searchService.autocomplete(searchDto);
  }
}
