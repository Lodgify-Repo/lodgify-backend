import { Module } from '@nestjs/common';
import { OffersService } from './services/offers.service';
import { OffersController } from './http/offers.controller';

@Module({
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
