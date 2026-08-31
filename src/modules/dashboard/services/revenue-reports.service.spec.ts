import { Test, TestingModule } from '@nestjs/testing';
import { RevenueReportsService } from './revenue-reports.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('RevenueReportsService', () => {
  let service: RevenueReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueReportsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<RevenueReportsService>(RevenueReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
