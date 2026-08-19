import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { AuditLogLevel, AuditLogAction } from '@prisma/client';

export type LogSource = 'audit' | 'files' | 'all';

export class SystemLogsQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AuditLogLevel)
  level?: AuditLogLevel;

  @IsOptional()
  @IsEnum(AuditLogAction)
  action?: AuditLogAction;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['audit', 'files', 'all'] as const)
  source?: LogSource = 'audit';

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @Type(() => Number)
  tail?: number = 200;
}

export class ClearLogsDto {
  @IsOptional()
  @Type(() => Number)
  retentionDays?: number = 90;
}
