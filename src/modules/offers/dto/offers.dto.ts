import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  propertyId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateOfferStatusDto {
  @IsEnum(['ACCEPTED', 'REJECTED'])
  status: 'ACCEPTED' | 'REJECTED';
}
