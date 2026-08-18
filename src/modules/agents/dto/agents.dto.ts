import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateAgentProfileDto {
  @IsString()
  agencyName: string;

  @IsString()
  licenseNumber: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  socialLinks?: string; // JSON string for simplicity
}

export class UpdateAgentProfileDto extends CreateAgentProfileDto {}
