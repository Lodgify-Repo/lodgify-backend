import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class SearchHotelsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  query?: string; // Location or hotel name

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  guests?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  amenities?: string[];

  @IsOptional()
  @IsEnum(['price', 'name'] as const)
  sortBy?: 'price' | 'name' = 'name';

  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc' = 'asc';
}

