import { DomainErrorCode } from '@/common/domain/error';
import { HttpStatus } from '@nestjs/common';

export const AgentErrorCodes = {
  ...DomainErrorCode,
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  USER_ALREADY_AGENT: 'USER_ALREADY_AGENT',
} as const;

export const AgentErrorMap: Record<string, HttpStatus> = {
  [AgentErrorCodes.AGENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [AgentErrorCodes.USER_ALREADY_AGENT]: HttpStatus.CONFLICT,
};
