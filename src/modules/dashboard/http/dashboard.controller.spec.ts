import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { OccupancyAnalyticsService } from '../services/occupancy-analytics.service';
import { RevenueReportsService } from '../services/revenue-reports.service';
import { BookingListService } from '../services/booking-list.service';
import { TodayOperationsService } from '../services/today-operations.service';
import { PropertyOwnerDashboardService } from '../services/property-owner-dashboard.service';
import { AgentDashboardService } from '../services/agent-dashboard.service';
import { InventoryReportsService } from '../services/inventory-reports.service';
import { FnbAnalyticsService } from '../services/fnb-analytics.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockService = {
    getAdminStats: jest.fn(),
    getOwnerDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockService },
        { provide: OccupancyAnalyticsService, useValue: {} },
        { provide: RevenueReportsService, useValue: {} },
        { provide: BookingListService, useValue: {} },
        { provide: TodayOperationsService, useValue: {} },
        { provide: PropertyOwnerDashboardService, useValue: {} },
        { provide: AgentDashboardService, useValue: {} },
        { provide: InventoryReportsService, useValue: {} },
        { provide: FnbAnalyticsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminStats', () => {
    it('should return stats', async () => {
      mockService.getAdminStats.mockResolvedValue({ totalHotels: 5 });
      const result = await controller.getAdminStats();
      expect(result.totalHotels).toBe(5);
    });
  });

  describe('getOwnerDashboard', () => {
    it('should return dashboard', async () => {
      mockService.getOwnerDashboard.mockResolvedValue({ totalRevenue: 1000 });
      const result = await controller.getOwnerDashboard({ user: { id: 'u1' } } as any);
      expect(result.totalRevenue).toBe(1000);
    });
  });
});
