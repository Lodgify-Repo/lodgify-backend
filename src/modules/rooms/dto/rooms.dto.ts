import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsDateString, IsBoolean, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus } from '@prisma/client';

export class CreateRoomTypeDto {
  @ApiProperty({ description: 'Room type name', example: 'Deluxe Suite' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Room type description', example: 'Spacious suite with ocean view' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Base price per night', example: 25000 })
  @IsNumber()
  basePrice: number;

  @ApiProperty({ description: 'Maximum guest occupancy', example: 3 })
  @IsNumber()
  maxOccupancy: number;

  @ApiProperty({ description: 'Number of beds', example: 2 })
  @IsNumber()
  beds: number;

  @ApiPropertyOptional({ description: 'Room size in square feet', example: 450 })
  @IsOptional()
  @IsNumber()
  sizeSqft?: number;

  @ApiPropertyOptional({ description: 'Array of image URLs', example: ['https://storage.example.com/rooms/deluxe1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Room amenities', example: ['WiFi', 'Mini Bar', 'Balcony'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}

export class UpdateRoomTypeDto extends CreateRoomTypeDto {}

export class CreateRoomDto {
  @ApiProperty({ description: 'Room type ID', example: 'clxyz123' })
  @IsString()
  roomTypeId: string;

  @ApiProperty({ description: 'Room number/identifier', example: '301A' })
  @IsString()
  roomNumber: string;

  @ApiPropertyOptional({ description: 'Floor level', example: '3' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ description: 'Room status', enum: RoomStatus })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({ description: 'Special features of the room', example: ['Corner room', 'Near elevator'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Room images (max 10)', example: ['image1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  images?: string[];
}

export class UpdateRoomDto extends CreateRoomDto {}

export class UpdateRoomStatusDto {
  @ApiProperty({ description: 'New room status', enum: RoomStatus })
  @IsEnum(RoomStatus)
  status: RoomStatus;
}

export class CreateRoomMaintenanceDto {
  @ApiProperty({ description: 'Start date of maintenance' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of maintenance' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Reason for maintenance' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreatePricingRuleDto {
  @ApiProperty({ description: 'Pricing rule name', example: 'Christmas Special' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Rule type', example: 'SEASONAL', enum: ['SEASONAL', 'WEEKEND', 'EVENT'] })
  @IsString()
  type: string; // SEASONAL, WEEKEND, EVENT

  @ApiProperty({ description: 'Modifier type', example: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  @IsString()
  modifierType: string; // PERCENTAGE, FIXED_AMOUNT

  @ApiProperty({ description: 'Modifier value (percentage or fixed amount)', example: 15 })
  @IsNumber()
  modifierValue: number;

  @ApiProperty({ description: 'Rule start date (ISO 8601)', example: '2026-12-20' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Rule end date (ISO 8601)', example: '2026-12-31' })
  @IsDateString()
  endDate: string;
}
