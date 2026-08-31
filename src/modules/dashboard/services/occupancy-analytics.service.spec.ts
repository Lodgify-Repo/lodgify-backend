import { Test, TestingModule } from '@nestjs/testing';
import { OccupancyAnalyticsService } from './occupancy-analytics.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('OccupancyAnalyticsService', () => {
  let service: OccupancyAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccupancyAnalyticsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<OccupancyAnalyticsService>(OccupancyAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
