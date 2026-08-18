import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const FoodErrorCodes = {
  ...DomainErrorCode,
  MENU_ITEM_NOT_FOUND: 'MENU_ITEM_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
} as const;

export const FoodErrorMap: Record<string, HttpStatus> = {
  [FoodErrorCodes.MENU_ITEM_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [FoodErrorCodes.ORDER_NOT_FOUND]: HttpStatus.NOT_FOUND,
};
