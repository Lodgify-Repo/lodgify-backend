import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const ViewingErrorCodes = {
  ...DomainErrorCode,
  VIEWING_NOT_FOUND: 'VIEWING_NOT_FOUND',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
} as const;

export const ViewingErrorMap: Record<string, HttpStatus> = {
  [ViewingErrorCodes.VIEWING_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ViewingErrorCodes.SLOT_UNAVAILABLE]: HttpStatus.CONFLICT,
};
