import { Test, TestingModule } from '@nestjs/testing';
import { PropertyOwnerDashboardService } from './property-owner-dashboard.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('PropertyOwnerDashboardService', () => {
  let service: PropertyOwnerDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyOwnerDashboardService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<PropertyOwnerDashboardService>(PropertyOwnerDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
