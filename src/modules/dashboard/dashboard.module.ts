import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { OccupancyAnalyticsService } from './services/occupancy-analytics.service';
import { RevenueReportsService } from './services/revenue-reports.service';
import { BookingListService } from './services/booking-list.service';
import { TodayOperationsService } from './services/today-operations.service';
import { PropertyOwnerDashboardService } from './services/property-owner-dashboard.service';
import { AgentDashboardService } from './services/agent-dashboard.service';
import { InventoryReportsService } from './services/inventory-reports.service';
import { FnbAnalyticsService } from './services/fnb-analytics.service';
import { DashboardController } from './http/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    OccupancyAnalyticsService,
    RevenueReportsService,
    BookingListService,
    TodayOperationsService,
    PropertyOwnerDashboardService,
    AgentDashboardService,
    InventoryReportsService,
    FnbAnalyticsService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
