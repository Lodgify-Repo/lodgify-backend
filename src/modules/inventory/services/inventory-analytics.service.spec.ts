import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAnalyticsService } from './inventory-analytics.service';

describe('InventoryAnalyticsService', () => {
  let instance: InventoryAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryAnalyticsService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<InventoryAnalyticsService>(InventoryAnalyticsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
