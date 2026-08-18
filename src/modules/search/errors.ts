import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const SearchErrorCodes = {
  ...DomainErrorCode,
  INVALID_SEARCH_PARAMS: 'INVALID_SEARCH_PARAMS',
} as const;

export const SearchErrorMap: Record<string, HttpStatus> = {
  [SearchErrorCodes.INVALID_SEARCH_PARAMS]: HttpStatus.BAD_REQUEST,
};
