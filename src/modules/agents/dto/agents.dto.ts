export * from './agents-extended.dto';
import {
  CreateAgentProfileExtendedDto,
  UpdateAgentProfileExtendedDto,
  SubmitAgentVerificationDto as SubmitAgentVerificationExtendedDto,
} from './agents-extended.dto';

export class CreateAgentProfileDto extends CreateAgentProfileExtendedDto {}
export class UpdateAgentProfileDto extends UpdateAgentProfileExtendedDto {}
export class SubmitAgentVerificationDto extends SubmitAgentVerificationExtendedDto {}
