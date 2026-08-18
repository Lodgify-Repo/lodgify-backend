import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const UserErrorCodes = {
  ...DomainErrorCode,
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_PROFILE_DATA: 'INVALID_PROFILE_DATA',
} as const;

export const UserErrorMap: Record<string, HttpStatus> = {
  [UserErrorCodes.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [UserErrorCodes.INVALID_PROFILE_DATA]: HttpStatus.BAD_REQUEST,
};
