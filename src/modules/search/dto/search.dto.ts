import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class SearchHotelsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search query (location or hotel name)', example: 'Lagos beachfront' })
  @IsOptional()
  @IsString()
  query?: string; // Location or hotel name

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

  @ApiPropertyOptional({ description: 'Filter by amenities (comma-separated or array)', example: ['WiFi', 'Pool'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Sort results by field', enum: ['price', 'name'], default: 'name' })
  @IsOptional()
  @IsEnum(['price', 'name'] as const)
  sortBy?: 'price' | 'name' = 'name';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc' = 'asc';
}

