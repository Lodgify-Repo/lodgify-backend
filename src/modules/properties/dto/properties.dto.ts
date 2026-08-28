export * from './properties-extended.dto';
import { CreatePropertyExtendedDto, UpdatePropertyExtendedDto } from './properties-extended.dto';

export class CreatePropertyDto extends CreatePropertyExtendedDto {}
export class UpdatePropertyDto extends UpdatePropertyExtendedDto {}

export class SubmitPropertyOwnerVerificationDto {
  deedUrl: string;
  utilityBillUrl: string;
  idUrl: string;
}
