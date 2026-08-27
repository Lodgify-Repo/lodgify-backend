import { IsOptional, IsString, IsDateString, IsEnum, IsNumberString, IsBooleanString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class BookingListQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ description: 'Filter by booking status', enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'] })
  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'])
  status?: string;

  @ApiPropertyOptional({ description: 'Search by guest name' })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'checkInDate', 'checkOutDate', 'totalAmount', 'status'] })
  @IsOptional()
  @IsEnum(['createdAt', 'checkInDate', 'checkOutDate', 'totalAmount', 'status'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page', default: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class BookingExportQueryDto extends BookingListQueryDto {
  @ApiPropertyOptional({ description: 'Export format', enum: ['csv'], default: 'csv' })
  @IsOptional()
  @IsString()
  format?: string;
}

export class OccupancyQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID (omit for all branches)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Aggregation period', enum: ['daily', 'weekly', 'monthly'], default: 'daily' })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
