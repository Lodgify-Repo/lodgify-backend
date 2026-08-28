import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { PropertyMarketplaceService } from '../services/property-marketplace.service';
import { PropertyMarketplaceQueryDto } from '../dto/properties-extended.dto';

@ApiTags('Properties - Marketplace')
@Controller('marketplace')
export class PropertyMarketplaceController {
  constructor(private readonly marketplaceService: PropertyMarketplaceService) {}

  @Get('search')
  @ApiOperation({ summary: 'F-P04: Marketplace search with filters (type, price, beds/baths, radius, pet-friendly, furnished, amenities)' })
  async searchMarketplace(@Query() queryDto: PropertyMarketplaceQueryDto) {
    return this.marketplaceService.searchMarketplace(queryDto);
  }

  @Get('map-pins')
  @ApiOperation({ summary: 'F-P04: Map view returning lightweight price pins with geo coordinates' })
  @ApiQuery({ name: 'latitude', required: false })
  @ApiQuery({ name: 'longitude', required: false })
  @ApiQuery({ name: 'radius', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'listingType', required: false })
  async getMapPins(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
    @Query('type') type?: string,
    @Query('listingType') listingType?: string,
  ) {
    return this.marketplaceService.getMapPins({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      type,
      listingType,
    });
  }

  @Get('properties/:propertyId/similar')
  @ApiOperation({ summary: 'F-P12: Get similar properties recommendation (location, price, type, amenities algorithm)' })
  @ApiQuery({ name: 'limit', required: false, example: 4 })
  async getSimilarProperties(
    @Param('propertyId') propertyId: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getSimilarProperties(propertyId, limit ? parseInt(limit) : 4);
  }
}
