import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const DashboardErrorCodes = {
  ...DomainErrorCode,
  ACCESS_DENIED: 'ACCESS_DENIED',
} as const;

export const DashboardErrorMap: Record<string, HttpStatus> = {
  [DashboardErrorCodes.ACCESS_DENIED]: HttpStatus.FORBIDDEN,
};
