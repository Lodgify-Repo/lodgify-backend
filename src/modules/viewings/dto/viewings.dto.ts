import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleViewingDto {
  @ApiProperty({ description: 'Property ID to schedule a viewing for', example: 'clxyz789' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Viewing date and time (ISO 8601)', example: '2026-09-20T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prefer morning time slots' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateViewingStatusDto {
  @ApiProperty({ description: 'New viewing status', enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'] })
  @IsEnum(['CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}
