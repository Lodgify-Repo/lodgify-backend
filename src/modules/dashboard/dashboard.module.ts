import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './http/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
