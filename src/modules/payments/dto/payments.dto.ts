import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Booking ID to pay for', example: 'clxyz789' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Payment amount in kobo/cents', example: 5000000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payer email address', example: 'guest@example.com' })
  @IsString()
  email: string;
}

export class WebhookDto {
  @ApiProperty({ description: 'Paystack event type', example: 'charge.success' })
  @IsString()
  event: string;

  @ApiPropertyOptional({ description: 'Webhook event payload data' })
  @IsOptional()
  data: any;
}
