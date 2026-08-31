import { Test, TestingModule } from '@nestjs/testing';
import { TodayOperationsService } from './today-operations.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('TodayOperationsService', () => {
  let service: TodayOperationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodayOperationsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<TodayOperationsService>(TodayOperationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
