import { Test, TestingModule } from '@nestjs/testing';
import { StockCountsController } from './stock-counts.controller';

describe('StockCountsController', () => {
  let instance: StockCountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockCountsController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<StockCountsController>(StockCountsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
