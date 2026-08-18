import { IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateUserStatusDto {
  @IsEnum(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifyAgentDto {
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';
}
