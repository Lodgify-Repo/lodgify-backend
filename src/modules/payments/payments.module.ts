import { Module } from '@nestjs/common';
import { PaymentsService } from './services/payments.service';
import { PaystackService } from './services/paystack.service';
import { PaymentsController } from './http/payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
