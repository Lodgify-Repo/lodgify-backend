import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentProfileDto {
  @ApiProperty({ description: 'Agency name', example: 'Premier Realty Ltd' })
  @IsString()
  agencyName: string;

  @ApiProperty({ description: 'Agent license number', example: 'LIC-2024-00456' })
  @IsString()
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'Agent biography', example: 'Experienced real estate agent with 10+ years in luxury properties' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Years of professional experience', example: 10 })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Agent website URL', example: 'https://premierrealty.ng' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links (JSON string)', example: '{"instagram":"@premierrealty"}' })
  @IsOptional()
  @IsString()
  socialLinks?: string; // JSON string for simplicity
}

export class UpdateAgentProfileDto extends CreateAgentProfileDto {}

export class SubmitAgentVerificationDto {
  @ApiProperty({ description: 'GCS URL of the license document' })
  @IsString()
  licenseUrl: string;

  @ApiProperty({ description: 'GCS URL of the company registration document' })
  @IsString()
  companyRegistrationUrl: string;
}
