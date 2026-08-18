import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  next_cursor?: string;
  has_more?: boolean;
}
