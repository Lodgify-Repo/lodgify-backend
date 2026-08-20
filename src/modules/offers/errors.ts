import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const OfferErrorCodes = {
  ...DomainErrorCode,
  OFFER_NOT_FOUND: 'OFFER_NOT_FOUND',
  OFFER_USER_NOT_FOUND: 'OFFER_USER_NOT_FOUND',
  OFFER_PROPERTY_NOT_FOUND: 'OFFER_PROPERTY_NOT_FOUND',
  OFFER_DUPLICATE_PENDING: 'OFFER_DUPLICATE_PENDING',
} as const;

export const OfferErrorMap: Record<string, HttpStatus> = {
  [OfferErrorCodes.OFFER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [OfferErrorCodes.OFFER_USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [OfferErrorCodes.OFFER_PROPERTY_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [OfferErrorCodes.OFFER_DUPLICATE_PENDING]: HttpStatus.CONFLICT,
};
