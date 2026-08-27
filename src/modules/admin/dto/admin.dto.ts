import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'New user account status', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] })
  @IsEnum(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';

  @ApiPropertyOptional({ description: 'Reason for status change', example: 'Violation of terms of service' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifyAgentDto {
  @ApiProperty({ description: 'Agent verification decision', enum: ['VERIFIED', 'REJECTED'] })
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';
}

export class VerifyHotelDto {
  @ApiProperty({ description: 'Hotel verification decision', enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    description: 'Admin notes on the verification decision',
    example: 'All documents verified. Business registration confirmed.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

