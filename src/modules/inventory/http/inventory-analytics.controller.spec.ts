import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAnalyticsController } from './inventory-analytics.controller';

describe('InventoryAnalyticsController', () => {
  let instance: InventoryAnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryAnalyticsController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<InventoryAnalyticsController>(InventoryAnalyticsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
