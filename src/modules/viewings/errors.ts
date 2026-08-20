import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const ViewingErrorCodes = {
  ...DomainErrorCode,
  VIEWING_NOT_FOUND: 'VIEWING_NOT_FOUND',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  VIEWING_PROPERTY_NOT_FOUND: 'VIEWING_PROPERTY_NOT_FOUND',
  VIEWING_USER_NOT_FOUND: 'VIEWING_USER_NOT_FOUND',
  VIEWING_INVALID_DATE: 'VIEWING_INVALID_DATE',
} as const;

export const ViewingErrorMap: Record<string, HttpStatus> = {
  [ViewingErrorCodes.VIEWING_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ViewingErrorCodes.SLOT_UNAVAILABLE]: HttpStatus.CONFLICT,
  [ViewingErrorCodes.VIEWING_PROPERTY_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ViewingErrorCodes.VIEWING_USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ViewingErrorCodes.VIEWING_INVALID_DATE]: HttpStatus.UNPROCESSABLE_ENTITY,
};
