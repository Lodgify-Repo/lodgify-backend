import { IsString, IsNumber, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ description: 'Property title', example: '3 Bedroom Apartment in Lekki' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed property description', example: 'Beautifully furnished 3-bedroom apartment with modern amenities' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Property type', enum: ['APARTMENT', 'VILLA', 'COMMERCIAL'] })
  @IsIn(['APARTMENT', 'VILLA', 'COMMERCIAL'])
  type: string;

  @ApiProperty({ description: 'Listing type', enum: ['SALE', 'RENT'] })
  @IsIn(['SALE', 'RENT'])
  listingType: string;

  @ApiProperty({ description: 'Property price', example: 45000000 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Street address', example: '15 Admiralty Road' })
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

  @ApiPropertyOptional({ description: 'Number of bedrooms', example: 3 })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms', example: 2 })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Property area in square feet', example: 1800 })
  @IsOptional()
  @IsNumber()
  areaSqft?: number;

  @ApiPropertyOptional({ description: 'Property features', example: ['Swimming Pool', 'Generator', 'Security'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Property image URLs', example: ['https://storage.example.com/properties/prop1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdatePropertyDto extends CreatePropertyDto {}
