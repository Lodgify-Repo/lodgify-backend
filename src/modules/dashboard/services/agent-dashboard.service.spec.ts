import { Test, TestingModule } from '@nestjs/testing';
import { AgentDashboardService } from './agent-dashboard.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('AgentDashboardService', () => {
  let service: AgentDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentDashboardService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<AgentDashboardService>(AgentDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
