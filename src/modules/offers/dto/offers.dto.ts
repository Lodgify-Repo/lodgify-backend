export * from './offers-extended.dto';
import { CreatePurchaseOfferExtendedDto } from './offers-extended.dto';

export class CreateOfferDto extends CreatePurchaseOfferExtendedDto {}

export class UpdateOfferStatusDto {
  status: string;
}
