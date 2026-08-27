import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty({ description: 'Branch ID to book at', example: 'clxyz123' })
  @IsString()
  branchId: string;

  @ApiPropertyOptional({ description: 'Specific room ID (optional, auto-assigned if omitted)', example: 'clxyz456' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ description: 'Check-in date (ISO 8601)', example: '2026-09-15' })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({ description: 'Check-out date (ISO 8601)', example: '2026-09-18' })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({ description: 'Number of guests', example: 2 })
  @IsNumber()
  guestsCount: number;

  @ApiPropertyOptional({ description: 'Special requests from the guest', example: 'Late check-in, extra pillows' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ description: 'Booking source', example: 'WEB' })
  @IsOptional()
  @IsEnum(['WEB', 'PHONE', 'WALK_IN', 'OTA', 'CORP', 'OTHER'])
  source?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ description: 'New booking status', enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'] })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
