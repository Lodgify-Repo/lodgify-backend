import { Test, TestingModule } from '@nestjs/testing';
import { FnbAnalyticsService } from './fnb-analytics.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('FnbAnalyticsService', () => {
  let service: FnbAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FnbAnalyticsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<FnbAnalyticsService>(FnbAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
