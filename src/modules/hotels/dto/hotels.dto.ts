import { IsString, IsOptional, IsNumber, IsEmail, IsPhoneNumber, IsInt, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ---------------------------------------------------------
// Hotel DTOs (F-H01)
// ---------------------------------------------------------

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

  @ApiPropertyOptional({ description: 'Star rating (1-5)', example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  starRating?: number;

  @ApiPropertyOptional({ description: 'Hotel contact email', example: 'info@grandlodgify.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Hotel contact phone', example: '+2348012345678' })
  @IsOptional()
  @IsPhoneNumber()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'URLs of verification documents (business registration, photos, etc.)',
    example: ['https://storage.example.com/docs/registration.pdf'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationDocuments?: string[];
}

export class UpdateHotelDto extends PartialType(CreateHotelDto) {}

// ---------------------------------------------------------
// Branch DTOs (F-H02, F-H03)
// ---------------------------------------------------------

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

  @ApiPropertyOptional({ description: 'Latitude coordinate (auto-geocoded if omitted)', example: 6.4281 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate (auto-geocoded if omitted)', example: 3.4219 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ description: 'Branch contact email', example: 'vi@lodgify.com' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ description: 'Branch contact phone', example: '+2348012345678' })
  @IsPhoneNumber()
  contactPhone: string;

  @ApiPropertyOptional({
    description: 'Branch photo URLs',
    example: ['https://storage.example.com/branch/lobby.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({
    description: 'Branch amenities',
    example: ['WIFI', 'POOL', 'GYM', 'PARKING', 'SPA'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Branch policies (check-in/out times, cancellation, pet policy, etc.)',
    example: { checkIn: '14:00', checkOut: '11:00', cancellation: 'Free cancellation up to 24h before check-in' },
  })
  @IsOptional()
  policies?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Whether food service is enabled for this branch', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  foodServiceEnabled?: boolean;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}
