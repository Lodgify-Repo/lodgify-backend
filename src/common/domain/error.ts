export enum DomainErrorCode {
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  FORBIDDEN = 'FORBIDDEN',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
}

export class DomainError extends Error {
  constructor(
    public readonly code: string, // string (not enum) so modules can extend freely
    message?: string,
    public readonly meta?: Record<string, unknown>
  ) {
    super(message ?? code);
    this.name = 'DomainError';
    Error.captureStackTrace(this, this.constructor);
  }
}
