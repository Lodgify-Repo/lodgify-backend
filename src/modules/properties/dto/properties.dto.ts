import { IsString, IsNumber, IsOptional, IsArray, IsIn } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsIn(['APARTMENT', 'VILLA', 'COMMERCIAL'])
  type: string;

  @IsIn(['SALE', 'RENT'])
  listingType: string;

  @IsNumber()
  price: number;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  areaSqft?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdatePropertyDto extends CreatePropertyDto {}
