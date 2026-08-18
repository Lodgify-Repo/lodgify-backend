import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const HotelErrorCodes = {
  ...DomainErrorCode,
  HOTEL_NOT_FOUND: 'HOTEL_NOT_FOUND',
  BRANCH_NOT_FOUND: 'BRANCH_NOT_FOUND',
  HOTEL_ALREADY_EXISTS: 'HOTEL_ALREADY_EXISTS',
} as const;

export const HotelErrorMap: Record<string, HttpStatus> = {
  [HotelErrorCodes.HOTEL_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [HotelErrorCodes.BRANCH_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [HotelErrorCodes.HOTEL_ALREADY_EXISTS]: HttpStatus.CONFLICT,
};
