import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const PropertyErrorCodes = {
  ...DomainErrorCode,
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
} as const;

export const PropertyErrorMap: Record<string, HttpStatus> = {
  [PropertyErrorCodes.PROPERTY_NOT_FOUND]: HttpStatus.NOT_FOUND,
};
