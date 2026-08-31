import { Test, TestingModule } from '@nestjs/testing';
import { LowStockAlertsController } from './low-stock-alerts.controller';

describe('LowStockAlertsController', () => {
  let instance: LowStockAlertsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LowStockAlertsController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<LowStockAlertsController>(LowStockAlertsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
