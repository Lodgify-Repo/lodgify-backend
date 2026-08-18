import { IsString, IsOptional, IsNumber, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateHotelDto extends CreateHotelDto {}

export class CreateBranchDto {
  @IsString()
  name: string;

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

  @IsEmail()
  contactEmail: string;

  @IsPhoneNumber()
  contactPhone: string;
}

export class UpdateBranchDto extends CreateBranchDto {}
