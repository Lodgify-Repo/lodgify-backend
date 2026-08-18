import { Module } from '@nestjs/common';
import { BookingListener } from './listeners/booking.listener';
import { PaymentListener } from './listeners/payment.listener';

@Module({
  providers: [BookingListener, PaymentListener],
})
export class NotificationsModule {}
