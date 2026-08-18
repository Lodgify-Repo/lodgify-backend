import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

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
  @IsString()
  status: string;
}
