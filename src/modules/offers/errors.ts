import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const OfferErrorCodes = {
  ...DomainErrorCode,
  OFFER_NOT_FOUND: 'OFFER_NOT_FOUND',
} as const;

export const OfferErrorMap: Record<string, HttpStatus> = {
  [OfferErrorCodes.OFFER_NOT_FOUND]: HttpStatus.NOT_FOUND,
};
