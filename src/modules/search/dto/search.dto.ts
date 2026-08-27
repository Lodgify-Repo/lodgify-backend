import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class SearchHotelsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search query (location or hotel name)', example: 'Lagos beachfront' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Check-in date (ISO 8601)', example: '2026-09-15' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ description: 'Check-out date (ISO 8601)', example: '2026-09-18' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ description: 'Number of guests', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  guests?: number;

  @ApiPropertyOptional({ description: 'Minimum price per night', example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price per night', example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by country', example: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Minimum hotel star rating', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  starRating?: number;

  @ApiPropertyOptional({ description: 'Filter by amenities (comma-separated or array)', example: ['WiFi', 'Pool'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Latitude coordinate for distance sorting', example: 6.4281 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate for distance sorting', example: 3.4219 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Radius in km (only used if lat/lng provided)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @ApiPropertyOptional({ description: 'Sort results by field', enum: ['price', 'name', 'distance'], default: 'name' })
  @IsOptional()
  @IsEnum(['price', 'name', 'distance'] as const)
  sortBy?: 'price' | 'name' | 'distance' = 'name';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class SearchPropertiesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search query (title or location)', example: 'Lekki Villa' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Property type', enum: ['APARTMENT', 'VILLA', 'COMMERCIAL'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Listing type', enum: ['SALE', 'RENT'] })
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional({ description: 'Minimum number of bedrooms', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Minimum price', example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 5000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by amenities (comma-separated or array)', example: ['Pool'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Latitude coordinate for distance sorting' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate for distance sorting' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Radius in km (only used if lat/lng provided)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @ApiPropertyOptional({ description: 'Sort results by field', enum: ['price', 'name', 'distance'], default: 'name' })
  @IsOptional()
  @IsEnum(['price', 'name', 'distance'] as const)
  sortBy?: 'price' | 'name' | 'distance' = 'name';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class AutocompleteDto {
  @ApiPropertyOptional({ description: 'Query string for autocomplete' })
  @IsString()
  query: string;
}

