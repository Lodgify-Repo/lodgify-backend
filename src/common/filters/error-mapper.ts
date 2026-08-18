import { DomainError, DomainErrorCode } from '../domain/error';
import { HttpStatus } from '@nestjs/common';

const globalDomainMap: Record<string, HttpStatus> = {
  [DomainErrorCode.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorCode.RESOURCE_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [DomainErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [DomainErrorCode.VALIDATION_FAILED]: HttpStatus.BAD_REQUEST,
  [DomainErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [DomainErrorCode.PAYMENT_FAILED]: HttpStatus.PAYMENT_REQUIRED,
  [DomainErrorCode.BOOKING_CONFLICT]: HttpStatus.CONFLICT,
};

const registeredMaps: Record<string, HttpStatus> = {};

export function registerErrorMap(map: Record<string, HttpStatus>): void {
  Object.assign(registeredMaps, map);
}

export function mapDomainError(error: DomainError): HttpStatus {
  return registeredMaps[error.code] ?? globalDomainMap[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
}
