import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const PaymentErrorCodes = {
  ...DomainErrorCode,
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  GATEWAY_ERROR: 'GATEWAY_ERROR',
} as const;

export const PaymentErrorMap: Record<string, HttpStatus> = {
  [PaymentErrorCodes.PAYMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [PaymentErrorCodes.INVALID_AMOUNT]: HttpStatus.BAD_REQUEST,
  [PaymentErrorCodes.GATEWAY_ERROR]: HttpStatus.BAD_GATEWAY,
};
