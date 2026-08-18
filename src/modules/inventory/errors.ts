import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const InventoryErrorCodes = {
  ...DomainErrorCode,
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
} as const;

export const InventoryErrorMap: Record<string, HttpStatus> = {
  [InventoryErrorCodes.ITEM_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [InventoryErrorCodes.INSUFFICIENT_STOCK]: HttpStatus.BAD_REQUEST,
};
