import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const RoomErrorCodes = {
  ...DomainErrorCode,
  ROOM_TYPE_NOT_FOUND: 'ROOM_TYPE_NOT_FOUND',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_NUMBER_EXISTS: 'ROOM_NUMBER_EXISTS',
} as const;

export const RoomErrorMap: Record<string, HttpStatus> = {
  [RoomErrorCodes.ROOM_TYPE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [RoomErrorCodes.ROOM_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [RoomErrorCodes.ROOM_NUMBER_EXISTS]: HttpStatus.CONFLICT,
};
