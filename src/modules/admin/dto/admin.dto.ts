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
