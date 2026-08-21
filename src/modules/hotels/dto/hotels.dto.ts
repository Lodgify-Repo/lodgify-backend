import { IsString, IsOptional, IsNumber, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({ description: 'Hotel name', example: 'Grand Lodgify Resort' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Hotel description', example: 'A luxury beachfront resort' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Business registration number', example: 'BN-2024-00123' })
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @ApiPropertyOptional({ description: 'Tax identification number', example: 'TIN-9876543210' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'URL of the hotel logo', example: 'https://storage.example.com/logos/hotel.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateHotelDto extends CreateHotelDto {}

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch name', example: 'Victoria Island Branch' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Street address', example: '12 Admiralty Way' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City', example: 'Lagos' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State or region', example: 'Lagos' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Country', example: 'Nigeria' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 6.4281 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: 3.4219 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Branch contact email', example: 'vi@lodgify.com' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ description: 'Branch contact phone', example: '+2348012345678' })
  @IsPhoneNumber()
  contactPhone: string;
}

export class UpdateBranchDto extends CreateBranchDto {}
