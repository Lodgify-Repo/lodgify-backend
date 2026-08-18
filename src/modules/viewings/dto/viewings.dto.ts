import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class ScheduleViewingDto {
  @IsString()
  propertyId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateViewingStatusDto {
  @IsEnum(['CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}
