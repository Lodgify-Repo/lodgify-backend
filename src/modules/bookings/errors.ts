import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const BookingErrorCodes = {
  ...DomainErrorCode,
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  ROOM_UNAVAILABLE: 'ROOM_UNAVAILABLE',
  INVALID_DATES: 'INVALID_DATES',
  BRANCH_NOT_FOUND: 'BRANCH_NOT_FOUND',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
} as const;

export const BookingErrorMap: Record<string, HttpStatus> = {
  [BookingErrorCodes.BOOKING_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [BookingErrorCodes.ROOM_UNAVAILABLE]: HttpStatus.CONFLICT,
  [BookingErrorCodes.INVALID_DATES]: HttpStatus.UNPROCESSABLE_ENTITY,
  [BookingErrorCodes.BRANCH_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [BookingErrorCodes.ROOM_NOT_FOUND]: HttpStatus.NOT_FOUND,
};
