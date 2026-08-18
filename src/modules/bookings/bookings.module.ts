import { Module } from '@nestjs/common';
import { BookingsService } from './services/bookings.service';
import { BookingsController } from './http/bookings.controller';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
