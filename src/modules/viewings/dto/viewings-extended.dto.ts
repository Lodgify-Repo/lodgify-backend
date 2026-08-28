import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleSaleViewingDto {
  @ApiProperty({ description: 'Target Property ID' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Viewing appointment date & time (ISO)', example: '2026-09-20T11:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Viewing format / type',
    enum: ['OPEN_HOUSE', 'PRIVATE_SHOWING', 'VIRTUAL_TOUR'],
    default: 'PRIVATE_SHOWING',
  })
  @IsOptional()
  @IsIn(['OPEN_HOUSE', 'PRIVATE_SHOWING', 'VIRTUAL_TOUR'])
  viewingType?: 'OPEN_HOUSE' | 'PRIVATE_SHOWING' | 'VIRTUAL_TOUR';

  @ApiPropertyOptional({
    description: 'Host type',
    enum: ['OWNER', 'AGENT'],
    default: 'OWNER',
  })
  @IsOptional()
  @IsIn(['OWNER', 'AGENT'])
  hostType?: 'OWNER' | 'AGENT';

  @ApiPropertyOptional({ description: 'Host agent profile ID (if hosted by agent)' })
  @IsOptional()
  @IsString()
  hostId?: string;

  @ApiPropertyOptional({ description: 'Additional instructions or client questions' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateViewingStatusExtendedDto {
  @ApiProperty({
    description: 'Updated viewing status',
    enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
  })
  @IsIn(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'])
  status: string;

  @ApiPropertyOptional({ description: 'Host or client feedback notes' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ description: 'Rescheduled date & time (if status is RESCHEDULED)' })
  @IsOptional()
  @IsDateString()
  newScheduledDate?: string;
}
