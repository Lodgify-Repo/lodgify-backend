import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrisma = {
    hotel: { findUnique: jest.fn(), count: jest.fn() },
    user: { count: jest.fn() },
    booking: { findMany: jest.fn() },
    payment: { aggregate: jest.fn() },
    foodOrder: { aggregate: jest.fn() },
    inventoryItem: { findMany: jest.fn() },
    room: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOwnerDashboard', () => {
    it('should return empty stats if no hotel', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue(null);
      const result = await service.getOwnerDashboard('owner1');
      expect(result.totalRevenue).toBe(0);
    });

    it('should return stats for hotel owner', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue({ id: 'h1', branches: [{ id: 'b1' }] });
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.room.count.mockResolvedValue(10);
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
      mockPrisma.foodOrder.aggregate.mockResolvedValue({ _sum: { totalAmount: 200 } });
      mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

      const result = await service.getOwnerDashboard('owner1');
      expect(result.totalRevenue).toBe(1200);
      expect((result.occupancyRate as any).totalRooms).toBe(10);
    });
  });

  describe('getAdminStats', () => {
    it('should return admin stats', async () => {
      mockPrisma.hotel.count.mockResolvedValue(5);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });

      const result = await service.getAdminStats();
      expect(result.totalHotels).toBe(5);
      expect(result.totalUsers).toBe(100);
      expect(result.totalRevenue).toBe(5000);
    });
  });
});
