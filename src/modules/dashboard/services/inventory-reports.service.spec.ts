import { Test, TestingModule } from '@nestjs/testing';
import { InventoryReportsService } from './inventory-reports.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('InventoryReportsService', () => {
  let service: InventoryReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryReportsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<InventoryReportsService>(InventoryReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
