import { IsString, IsNumber, IsOptional } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  bookingId: string;

  @IsNumber()
  amount: number;

  @IsString()
  email: string;
}

export class WebhookDto {
  @IsString()
  event: string;

  @IsOptional()
  data: any;
}
