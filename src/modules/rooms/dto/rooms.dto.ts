import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { RoomStatus } from '@prisma/client';

export class CreateRoomTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  basePrice: number;

  @IsNumber()
  maxOccupancy: number;

  @IsNumber()
  beds: number;

  @IsOptional()
  @IsNumber()
  sizeSqft?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}

export class UpdateRoomTypeDto extends CreateRoomTypeDto {}

export class CreateRoomDto {
  @IsString()
  roomTypeId: string;

  @IsString()
  roomNumber: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}

export class UpdateRoomDto extends CreateRoomDto {}

export class CreatePricingRuleDto {
  @IsString()
  name: string;

  @IsString()
  type: string; // SEASONAL, WEEKEND, EVENT

  @IsString()
  modifierType: string; // PERCENTAGE, FIXED_AMOUNT

  @IsNumber()
  modifierValue: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
