import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsNumber()
  guestsCount: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
