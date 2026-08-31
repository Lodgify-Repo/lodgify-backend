import { Test, TestingModule } from '@nestjs/testing';
import { LowStockAlertsService } from './low-stock-alerts.service';

describe('LowStockAlertsService', () => {
  let instance: LowStockAlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LowStockAlertsService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<LowStockAlertsService>(LowStockAlertsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
