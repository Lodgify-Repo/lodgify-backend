import { Module } from '@nestjs/common';
import { ViewingsService } from './services/viewings.service';
import { ViewingsController } from './http/viewings.controller';

@Module({
  controllers: [ViewingsController],
  providers: [ViewingsService],
  exports: [ViewingsService],
})
export class ViewingsModule {}
